#include "../lib/json2.js"
#include "../lib/styles-utils.js"

var document = app.activeDocument;

var scriptLabel = document.extractLabel("changeParagraphStyleByCharacterStyle");
var savedSettings = scriptLabel ? JSON.parse(scriptLabel) : {};

var allParagraphStyles = document.allParagraphStyles;
var allCharacterStyles = document.allCharacterStyles;

var dialog = new Window('dialog', 'Change Paragraph Style By Character Style');
var doRun = false;

var sourceDropdown = addStyleDropdown(dialog, 'Source Paragraph Style', allParagraphStyles, savedSettings.source);
var destinationDropdown = addStyleDropdown(dialog, 'Destination Paragraph Style', allParagraphStyles, savedSettings.destination);
var characterDropdown = addStyleDropdown(dialog, 'Character Style', allCharacterStyles, savedSettings.character);

var buttonGroup = dialog.add('group');
buttonGroup.alignment = 'right';

var okButton = buttonGroup.add('button', undefined, 'Apply', { name: 'ok' });
okButton.onClick = function () {
  if (sourceDropdown.selection && destinationDropdown.selection && characterDropdown.selection) {
    doRun = true;
    dialog.close();
  } else {
    alert('Please select the three styles.');
  }
};

buttonGroup.add('button', undefined, 'Cancel', { name: 'cancel' });

dialog.show();

if (doRun) {
  var sourceStylePath = sourceDropdown.selection.text;
  var destinationStylePath = destinationDropdown.selection.text;
  var characterStylePath = characterDropdown.selection.text;

  document.insertLabel("changeParagraphStyleByCharacterStyle", JSON.stringify({
    source: sourceStylePath,
    destination: destinationStylePath,
    character: characterStylePath
  }));

  var sourceStyle = findStyleByPath(sourceStylePath, 'paragraph');
  var destinationStyle = findStyleByPath(destinationStylePath, 'paragraph');
  var characterStyle = findStyleByPath(characterStylePath, 'character');

  if (!sourceStyle || !destinationStyle || !characterStyle) {
    alert('One of the selected styles could not be found.');
  } else {
    // Collect the paragraphs to scan: restrict to the selection when there is
    // one, otherwise walk the whole document.
    var selection = app.selection[0];
    var paragraphsToProcess = [];
    if (selection && selection.contents && selection.paragraphs) {
      for (var i = 0; i < selection.paragraphs.length; i++) {
        paragraphsToProcess.push(selection.paragraphs.item(i));
      }
    } else {
      for (var storyIndex = 0; storyIndex < document.stories.length; storyIndex++) {
        var story = document.stories.item(storyIndex);
        for (var pIdx = 0; pIdx < story.paragraphs.length; pIdx++) {
          paragraphsToProcess.push(story.paragraphs.item(pIdx));
        }
      }
    }

    // Wrap in ENTIRE_SCRIPT undo mode so one Ctrl-Z reverts every change.
    app.doScript(function () {
      for (var k = 0; k < paragraphsToProcess.length; k++) {
        var paragraph = paragraphsToProcess[k];
        if (paragraph.appliedParagraphStyle !== sourceStyle) continue;
        if (!allCharactersHaveStyle(paragraph, characterStyle)) continue;
        paragraph.appliedParagraphStyle = destinationStyle;
      }
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Change Paragraph Style By Character Style");
  }
}

function allCharactersHaveStyle(paragraph, characterStyle) {
  var paragraphLength = paragraph.contents.length;
  var runningOffset = 0;
  var sawAny = false;
  for (var i = 0; i < paragraph.textStyleRanges.length; i++) {
    if (runningOffset >= paragraphLength) break;
    var range = paragraph.textStyleRanges.item(i);
    var rangeContents = range.contents;
    // Clip to the current paragraph — textStyleRanges can extend past the
    // paragraph boundary when the same style is used on both sides.
    var remaining = paragraphLength - runningOffset;
    if (rangeContents.length > remaining) {
      rangeContents = rangeContents.substring(0, remaining);
    }
    // Ignore ranges that are effectively only whitespace or the paragraph
    // terminator — they carry a style only incidentally.
    var meaningful = rangeContents.replace(/[ \r\n\u2028]+/g, '').length > 0;
    if (!meaningful) {
      runningOffset += rangeContents.length;
      continue;
    }
    if (range.appliedCharacterStyle !== characterStyle) return false;
    sawAny = true;
    runningOffset += rangeContents.length;
  }
  return sawAny;
}
