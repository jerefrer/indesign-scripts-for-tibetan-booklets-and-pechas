#include "../../lib/json2.js"
#include "../../lib/styles-utils.js"

var document = app.activeDocument;

var scriptLabel = document.extractLabel("capitalizeMantraGroupsStyle");
var savedStyle = scriptLabel ? JSON.parse(scriptLabel) : null;

var allParagraphStyles = document.allParagraphStyles;

var dialog = new Window('dialog', 'Capitalize Mantra Groups');
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
  document.insertLabel("capitalizeMantraGroupsStyle", JSON.stringify(selectedStylePath));

  var targetStyle = findStyleByPath(selectedStylePath, 'paragraph');
  if (!targetStyle) {
    alert('Style not found: ' + selectedStylePath);
  } else {
    for (var storyIndex = 0; storyIndex < document.stories.length; storyIndex++) {
      var story = document.stories.item(storyIndex);
      for (var paragraphIndex = story.paragraphs.length - 1; paragraphIndex >= 0; --paragraphIndex) {
        var paragraph = story.paragraphs.item(paragraphIndex);
        if (paragraph.appliedParagraphStyle === targetStyle) {
          // Normalize every run of spaces+commas+pipes that contains at least one
          // comma or pipe down to exactly 4 spaces, so groups are consistently spaced.
          // Work backwards to keep earlier indices valid while editing.
          var contents = paragraph.contents;
          var separatorRuns = [];
          var c = 0;
          while (c < contents.length) {
            var cc = contents.charAt(c);
            if (cc === ' ' || cc === ',' || cc === '|') {
              var runStart = c;
              var runHasSeparator = false;
              while (c < contents.length) {
                var cc2 = contents.charAt(c);
                if (cc2 === ' ') { c++; }
                else if (cc2 === ',' || cc2 === '|') { runHasSeparator = true; c++; }
                else { break; }
              }
              if (runHasSeparator) {
                separatorRuns.push({ start: runStart, end: c });
              }
            } else {
              c++;
            }
          }
          for (var r = separatorRuns.length - 1; r >= 0; r--) {
            var run = separatorRuns[r];
            var range = paragraph.characters.itemByRange(run.start, run.end - 1);
            if (range.isValid) {
              range.contents = '    ';
            }
          }

          // Re-read contents after replacement, then capitalize each group start.
          contents = paragraph.contents;
          var groupStartRegex = /(^|  +)([^\s])/g;
          var match;
          var indicesToCapitalize = [];
          while ((match = groupStartRegex.exec(contents)) !== null) {
            indicesToCapitalize.push(match.index + match[1].length);
          }
          for (var i = 0; i < indicesToCapitalize.length; i++) {
            var character = paragraph.characters.item(indicesToCapitalize[i]);
            if (!character.isValid) continue;
            var ch = character.contents;
            if (typeof ch !== 'string') continue;
            var upper = ch.toUpperCase();
            if (upper !== ch) {
              character.contents = upper;
            }
          }
        }
      }
    }
  }
}
