#include "../../../lib/json2.js"
#include "../../../lib/styles-utils.js"

var scriptDirectory = File($.fileName).parent.fsName;

var document = app.activeDocument;
var selection = app.selection[0];

function insertMantra(isPhonetics) {
  // Wrap everything in a single doScript with ENTIRE_SCRIPT undo mode so all
  // paragraph insertions/deletions collapse into one Ctrl-Z step.
  app.doScript(function () {
    runInsertMantra(isPhonetics);
  }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Insert Mantra IAST");
}

function runInsertMantra(isPhonetics) {
  var scriptLabel = document.extractLabel("selectedStyles");
  var selectedStyles = scriptLabel ? JSON.parse(scriptLabel) : {};

  var tibetanStyle = findStyleByPath(selectedStyles.tibetan, 'paragraph');
  var mantraStyle = selectedStyles.mantra ? findStyleByPath(selectedStyles.mantra, 'paragraph') : null;
  var phoneticsStyle = selectedStyles.phonetics ? findStyleByPath(selectedStyles.phonetics, 'paragraph') : null;
  var smallLettersCharacterStyle = selectedStyles.smallLetters ? findStyleByPath(selectedStyles.smallLetters, 'character') : null;

  // Double-press detection: if the user triggers the script again within
  // 2 seconds, force-regenerate IAST for paragraphs that already have one.
  var DOUBLE_PRESS_WINDOW_MS = 2000;
  var now = new Date().getTime();
  var lastInvocationLabel = document.extractLabel("lastMantraIASTInvocationAt");
  var lastInvocation = lastInvocationLabel ? parseInt(lastInvocationLabel, 10) : 0;
  var forceRegenerate = lastInvocation > 0 && (now - lastInvocation) < DOUBLE_PRESS_WINDOW_MS;
  document.insertLabel("lastMantraIASTInvocationAt", String(now));

  // Patterns where small-letters segments must be kept so the transliterator
  // can expand the abbreviation (e.g. "arghaṁ pādyaṃ puṣpe ... śabda").
  var smallLettersExceptionPatterns = [
    /ཨརྒྷཾ་(པཱ་དྱཾ་)?སོགས་ནས། ཤབྡ་/,
    /ཨརྒྷཾ་(པཱ་དྱཾ་)?སོགས། ཤབྡ་/,
    /ཨརྒྷཾ་(པཱ་དྱཾ་)?ནས[་། ]+ཤབྡ/,
    /ཨརྒྷཾ་(པཱ་དྱཾ་)?ནས[་། ]+ཤཔྟ/,
    /ཨརྒྷཾ་(པཱ་དྱཾ་)?སོགས་ཀྱིས་མཆོད།/,
    /ཨརྒྷཾ་(པཱ་དྱཾ་)?སོགས།/,
    /པུཥྤེ་ནས[་། ]+ཤབྡ/,
    /པུཥྤེ་ནས[་། ]+ཤཔྟ/,
    /སྭ་བྷཱ་ཝས་སྦྱང/,
    /(སུཾ|སུམ)་(བྷ|བྷ)་ནི(ས་སྦྱང|་སོགས་ནས|་སོགས)/
  ];

  if (selection && selection.contents) {
    // Snapshot paragraphs into a plain array so the loop is not disturbed
    // by live re-evaluation of selection.paragraphs when we mutate the text.
    var paragraphsToProcess = [];
    for (var i = 0; i < selection.paragraphs.length; i++) {
      paragraphsToProcess.push(selection.paragraphs.item(i));
    }

    for (var paragraphIndex = paragraphsToProcess.length - 1; paragraphIndex >= 0; --paragraphIndex) {
      processParagraph(paragraphsToProcess[paragraphIndex], isPhonetics);
    }
  }

  function processParagraph(paragraph, isPhonetics) {
    if (paragraph.appliedParagraphStyle !== tibetanStyle) return;

    var followingParagraph = paragraph.insertionPoints.item(-1).paragraphs[0];
    var followingIsMantra = followingParagraph.isValid && followingParagraph.appliedParagraphStyle === mantraStyle;
    var followingIsPhonetics = followingParagraph.isValid && phoneticsStyle && followingParagraph.appliedParagraphStyle === phoneticsStyle;
    var hasExistingRelatedParagraph = followingIsMantra || followingIsPhonetics;

    if (hasExistingRelatedParagraph && !forceRegenerate) return;

    var textForIAST = buildTextForIAST(paragraph);
    var transliteration = generateIASTFor(textForIAST, isPhonetics).replace(/[\r\n]/g, '');
    if (transliteration.replace(/\s/g, '').length === 0) return;

    var noneCharStyle = findStyleByPath('[None]', 'character');

    if (hasExistingRelatedParagraph) {
      // Delete the existing mantra/phonetics paragraph entirely, then fall through
      // to the standard insertion path — this avoids style bleed into the next paragraph.
      followingParagraph.remove();
    }

    var insertionPoint = paragraph.insertionPoints.item(-1);
    insertionPoint.contents = "\r";

    var transliterationParagraph = insertionPoint.paragraphs[0];
    transliterationParagraph.contents = transliteration + "\r";
    transliterationParagraph.characters.everyItem().appliedCharacterStyle = noneCharStyle;
    transliterationParagraph.appliedParagraphStyle = mantraStyle;
  }

  // Forced line break inside a paragraph (Shift+Enter, U+2028, sometimes \n)
  // should act as a group boundary. Replace with 4 spaces so the transliterator's
  // multi-space capitalization kicks in. Paragraph terminators (\r) stay alone.
  function replaceForcedLineBreaks(text) {
    return text.replace(/[\u2028\n]/g, '    ');
  }

  function buildTextForIAST(paragraph) {
    var fullContents = paragraph.contents;
    if (!smallLettersCharacterStyle) {
      return replaceForcedLineBreaks(fullContents);
    }

    var paragraphLength = fullContents.length;

    // Apply the length-preserving part of removeUntranscribedPunctuationAndNormalize
    // so the exception patterns below match the same normalized form that the
    // transliterator uses internally. Only 1-to-1 substitutions are done here —
    // steps that change length (trim, ༔/ཿ tsheg injection, trailing tsheg removal)
    // are skipped so offsets still map back to the original paragraph characters.
    var normalizedForMatching = fullContents
      .replace(/[༵\u0F04-\u0F0A\u0F0D-\u0F1F\u0F3A-\u0F3F\u0FBE-\uF269]/g, '་')
      .replace(/[ྃྂ]/g, 'ཾ');

    // Find the character ranges protected by the exception patterns
    // (relative to the paragraph start), so small-letters inside them are kept.
    var protectedRanges = [];
    for (var p = 0; p < smallLettersExceptionPatterns.length; p++) {
      var regex = new RegExp(smallLettersExceptionPatterns[p].source, 'g');
      var match;
      while ((match = regex.exec(normalizedForMatching)) !== null) {
        protectedRanges.push({ start: match.index, end: match.index + match[0].length });
        if (match[0].length === 0) regex.lastIndex++;
      }
    }

    function isProtected(offset) {
      for (var r = 0; r < protectedRanges.length; r++) {
        if (offset >= protectedRanges[r].start && offset < protectedRanges[r].end) {
          return true;
        }
      }
      return false;
    }

    var result = '';
    var runningOffset = 0;
    for (var rangeIndex = 0; rangeIndex < paragraph.textStyleRanges.length; rangeIndex++) {
      if (runningOffset >= paragraphLength) break;
      var textStyleRange = paragraph.textStyleRanges.item(rangeIndex);
      var contents = textStyleRange.contents;
      // Clip to the current paragraph — textStyleRanges can extend past the
      // paragraph boundary when the same character style is used on both sides.
      var remaining = paragraphLength - runningOffset;
      if (contents.length > remaining) {
        contents = contents.substring(0, remaining);
      }
      var isSmallLetters = textStyleRange.appliedCharacterStyle === smallLettersCharacterStyle;
      if (isSmallLetters && !isProtected(runningOffset)) {
        // Drop the small-letters segment, keep a space so words don't merge.
        if (contents.replace(/[ \r\n]+/g, '').length) {
          result += ' ';
        } else {
          result += contents;
        }
      } else {
        result += contents;
      }
      runningOffset += contents.length;
    }
    return replaceForcedLineBreaks(result);
  }
}

function generateIASTFor(tibetan, isPhonetics) {  
  var inputFilePath = "/tmp/mantras_input.txt";
  var inputFile = new File(inputFilePath);

  inputFile.open("w");
  inputFile.encoding = "utf-8";
  inputFile.write(tibetan);
  inputFile.close();

  var appleScript =
  'set nodePath to "/opt/homebrew/bin/node"\r' +
  'set command to nodePath & " ' + scriptDirectory + '/tibskrit-transliterator-cli.js /tmp/mantras_input.txt ' + (isPhonetics ? 'true' : 'false') + '"\r' +
  'set output to do shell script command\r' +
  'return output\r';

  return app.doScript(appleScript, ScriptLanguage.APPLESCRIPT_LANGUAGE);
}