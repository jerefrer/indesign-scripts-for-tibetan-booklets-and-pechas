#include "../../lib/json2.js"
#include "../../lib/styles-utils.js"

var scriptDirectory = File($.fileName).parent.fsName;

var document = app.activeDocument;
var selection = app.selection[0];

function insertMantra(isPhonetics) {
  var scriptLabel = document.extractLabel("selectedStyles");
  var selectedStyles = scriptLabel ? JSON.parse(scriptLabel) : {};
  
  var tibetanStyle = findStyleByPath(selectedStyles.tibetan, 'paragraph');
  var mantraStyle = selectedStyles.mantra ? findStyleByPath(selectedStyles.mantra, 'paragraph') : null;
  var smallLettersCharacterStyle = selectedStyles.smallLetters ? findStyleByPath(selectedStyles.smallLetters, 'character') : null;

  // Patterns where small-letters segments must be kept so the transliterator
  // can expand the abbreviation (e.g. "arghaṁ pādyaṃ puṣpe ... śabda").
  var smallLettersExceptionPatterns = [
    /ཨརྒྷཾ་སོགས་ནས། ཤབྡ་/,
    /ཨརྒྷཾ་སོགས། ཤབྡ་/,
    /ཨརྒྷཾ་ནས[་། ]+ཤབྡ/,
    /ཨརྒྷཾ་ནས[་། ]+ཤཔྟ/,
    /ཨརྒྷཾ་སོགས་ཀྱིས་མཆོད།/,
    /ཨརྒྷཾ་སོགས།/,
    /པུཥྤེ་ནས[་། ]+ཤབྡ/,
    /པུཥྤེ་ནས[་། ]+ཤཔྟ/
  ];

  if (selection && selection.contents) {
    var selectedParagraphs = selection.paragraphs;

    for (var paragraphIndex = selectedParagraphs.length - 1; paragraphIndex >= 0; --paragraphIndex) {
      var paragraph = selectedParagraphs.item(paragraphIndex);
      processParagraph(paragraph, isPhonetics);
    }
  }

  function processParagraph(paragraph, isPhonetics) {
    var followingParagraph = paragraph.insertionPoints.item(-1).paragraphs[0];
    if (paragraph.appliedParagraphStyle === tibetanStyle && (!followingParagraph.isValid || followingParagraph.appliedParagraphStyle !== mantraStyle)) {
      var textForIAST = buildTextForIAST(paragraph);
      var transliteration = generateIASTFor(textForIAST, isPhonetics).replace(/[\r\n]/g, '');
      if (transliteration.replace(/\s/g, '').length === 0) {
        return;
      }
      var insertionPoint = paragraph.insertionPoints.item(-1);
      insertionPoint.contents = "\r";

      var transliterationParagraph = insertionPoint.paragraphs[0];
      transliterationParagraph.contents = transliteration + "\r";
      transliterationParagraph.textStyleRanges[0].appliedCharacterStyle = findStyleByPath('[None]', 'character');
      transliterationParagraph.appliedParagraphStyle = mantraStyle;
    }
  }

  function buildTextForIAST(paragraph) {
    var fullContents = paragraph.contents;
    if (!smallLettersCharacterStyle) {
      return fullContents;
    }

    // Find the character ranges protected by the exception patterns
    // (relative to the paragraph start), so small-letters inside them are kept.
    var protectedRanges = [];
    for (var p = 0; p < smallLettersExceptionPatterns.length; p++) {
      var regex = new RegExp(smallLettersExceptionPatterns[p].source, 'g');
      var match;
      while ((match = regex.exec(fullContents)) !== null) {
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
      var textStyleRange = paragraph.textStyleRanges.item(rangeIndex);
      var contents = textStyleRange.contents;
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
    return result;
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