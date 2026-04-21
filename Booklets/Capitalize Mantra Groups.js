#include "../lib/json2.js"
#include "../lib/styles-utils.js"

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
          // Step 1: normalize every run of spaces + explicit group markers
          // (, | !) to exactly 4 spaces — these punctuation marks are
          // consumed because they only exist to signal a group boundary.
          var contents = paragraph.contents;
          var separatorRuns = [];
          var c = 0;
          while (c < contents.length) {
            var cc = contents.charAt(c);
            if (cc === ' ' || cc === ',' || cc === '|' || cc === '!') {
              var runStart = c;
              var runHasSeparator = false;
              while (c < contents.length) {
                var cc2 = contents.charAt(c);
                if (cc2 === ' ') { c++; }
                else if (cc2 === ',' || cc2 === '|' || cc2 === '!') { runHasSeparator = true; c++; }
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

          // Step 2: identify the positions that must be upper-case — the first
          // non-whitespace character after each group boundary. Boundaries are:
          //   - start of paragraph
          //   - a run of 2+ spaces
          //   - an exclamation mark optionally followed by whitespace
          // Opening square brackets immediately before the letter are skipped
          // so that "[[om …" becomes "[[Om …".
          contents = paragraph.contents;
          var groupBoundaryRegex = /(^|  +|!\s*)(\[*)(\S)/g;
          var capitalizePositions = {};
          var match;
          while ((match = groupBoundaryRegex.exec(contents)) !== null) {
            capitalizePositions[match.index + match[1].length + match[2].length] = true;
          }

          // Step 3: walk every character, upper-case at capitalize positions,
          // lower-case everywhere else. This removes stray caps inside a group.
          for (var charIdx = 0; charIdx < contents.length; charIdx++) {
            var currentCh = contents.charAt(charIdx);
            var targetCh = capitalizePositions[charIdx] ? currentCh.toUpperCase() : currentCh.toLowerCase();
            if (targetCh === currentCh) continue;
            var charItem = paragraph.characters.item(charIdx);
            if (charItem.isValid) {
              charItem.contents = targetCh;
            }
          }

          // Step 4: strip a trailing single or double period and any trailing
          // whitespace from the end of the paragraph. An ellipsis of three or
          // more periods is preserved (only the whitespace after it is removed).
          contents = paragraph.contents;
          var cleanEnd = contents.length;
          if (cleanEnd > 0) {
            var lastCh = contents.charAt(cleanEnd - 1);
            if (lastCh === '\r' || lastCh === '\n') cleanEnd--;
          }
          var trimPos = cleanEnd;
          while (trimPos > 0 && contents.charAt(trimPos - 1) === ' ') trimPos--;
          var periodEnd = trimPos;
          while (trimPos > 0 && contents.charAt(trimPos - 1) === '.') trimPos--;
          var periodCount = periodEnd - trimPos;
          var removeStart = periodCount >= 3 ? periodEnd : trimPos;
          if (removeStart < cleanEnd) {
            var removeRange = paragraph.characters.itemByRange(removeStart, cleanEnd - 1);
            if (removeRange.isValid) {
              removeRange.remove();
            }
          }
        }
      }
    }
  }
}
