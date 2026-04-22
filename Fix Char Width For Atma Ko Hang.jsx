// For every paragraph in the active document that contains either
//   ཨཏྨ་ཀོ྅ཧཾ   or   ཨཏྨ་ཀོ྅་ཧཾ
// ensure that the avagraha ྅ is followed by a 40%-wide space and a tsheg.
// If the tsheg is missing, insert " ་" after ྅ and set the inserted space's
// horizontalScale to 40%.
//
// The whole operation is wrapped in app.doScript so that every change made
// by the script can be undone in a single Ctrl-Z.

app.doScript(
  function () {
    var document = app.activeDocument;

    var targetStrings = ["ཨཏྨ་ཀོ྅ཧཾ", "ཨཏྨ་ཀོ྅་ཧཾ", "ཤུདྡྷོ྅ཧཾ", "ཤུདྡྷོ྅་ཧཾ"];
    var avagraha = "྅";
    var SPACE_HORIZONTAL_SCALE = 34;

    for (
      var storyIndex = 0;
      storyIndex < document.stories.length;
      storyIndex++
    ) {
      var story = document.stories.item(storyIndex);
      for (
        var paragraphIndex = story.paragraphs.length - 1;
        paragraphIndex >= 0;
        --paragraphIndex
      ) {
        var paragraph = story.paragraphs.item(paragraphIndex);
        var contents = paragraph.contents;

        var matched = false;
        for (var s = 0; s < targetStrings.length; s++) {
          if (contents.indexOf(targetStrings[s]) !== -1) {
            matched = true;
            break;
          }
        }
        if (!matched) continue;

        // Collect all avagraha positions, then process in reverse so earlier
        // indices stay valid as we insert characters.
        var avagraphaPositions = [];
        var searchFrom = 0;
        while (true) {
          var pos = contents.indexOf(avagraha, searchFrom);
          if (pos === -1) break;
          avagraphaPositions.push(pos);
          searchFrom = pos + avagraha.length;
        }

        for (var p = avagraphaPositions.length - 1; p >= 0; p--) {
          var avPos = avagraphaPositions[p];
          var afterAvPos = avPos + avagraha.length;

          // Skip if a tsheg already follows (with or without leading space).
          var scanPos = afterAvPos;
          while (scanPos < contents.length && contents.charAt(scanPos) === " ")
            scanPos++;
          if (scanPos < contents.length && contents.charAt(scanPos) === "་")
            continue;

          // Insert " ་" right after the avagraha, then widen the space.
          paragraph.insertionPoints.item(afterAvPos).contents = " ་";
          var spaceChar = paragraph.characters.item(afterAvPos);
          if (spaceChar.isValid) {
            spaceChar.horizontalScale = SPACE_HORIZONTAL_SCALE;
          }

          // Refresh contents since we just mutated it.
          contents = paragraph.contents;
        }
      }
    }
  },
  ScriptLanguage.JAVASCRIPT,
  undefined,
  UndoModes.ENTIRE_SCRIPT,
  "Fix char width for atmako hang",
);
