#include "../lib/json2.js"
#include "../lib/styles-utils.js"

var document = app.activeDocument;

var scriptLabel = document.extractLabel("capitalizeFirstLetterStyle");
var savedStyle = scriptLabel ? JSON.parse(scriptLabel) : null;

var allParagraphStyles = document.allParagraphStyles;

var dialog = new Window('dialog', 'Capitalize First Letter');
var doRun = false;

var dropdown = addStyleDropdown(dialog, 'Paragraph Style', allParagraphStyles, savedStyle);

var buttonGroup = dialog.add('group');
buttonGroup.alignment = 'right';

var okButton = buttonGroup.add('button', undefined, 'Apply', { name: 'ok' });
okButton.onClick = function () {
  if (dropdown.selection) {
    doRun = true;
    dialog.close();
  } else {
    alert('Please select a paragraph style.');
  }
};

buttonGroup.add('button', undefined, 'Cancel', { name: 'cancel' });

dialog.show();

if (doRun) {
  var selectedStylePath = dropdown.selection.text;
  document.insertLabel("capitalizeFirstLetterStyle", JSON.stringify(selectedStylePath));

  var targetStyle = findStyleByPath(selectedStylePath, 'paragraph');
  if (!targetStyle) {
    alert('Style not found: ' + selectedStylePath);
  } else {
    // Build the list of paragraphs to scan: if the user has a text selection,
    // restrict to the paragraphs it touches; otherwise walk the whole document.
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

    // Wrap in ENTIRE_SCRIPT undo mode so one Ctrl-Z reverts every paragraph.
    app.doScript(function () {
      for (var paragraphIndex = paragraphsToProcess.length - 1; paragraphIndex >= 0; --paragraphIndex) {
        var paragraph = paragraphsToProcess[paragraphIndex];
        if (paragraph.appliedParagraphStyle !== targetStyle) continue;

        var contents = paragraph.contents;
        var firstLetterMatch = /^\s*(\S)/.exec(contents);
        if (!firstLetterMatch) continue;

        var idx = firstLetterMatch.index + firstLetterMatch[0].length - 1;
        var currentCh = contents.charAt(idx);
        var upper = currentCh.toUpperCase();
        if (upper === currentCh) continue;

        var character = paragraph.characters.item(idx);
        if (character.isValid) {
          character.contents = upper;
        }
      }
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Capitalize First Letter");
  }
}
