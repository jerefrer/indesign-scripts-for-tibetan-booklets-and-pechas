// Moves the paragraph containing the text cursor — or every paragraph
// touched by the current text selection — one paragraph up in its story.
// Implemented by moving the PREVIOUS paragraph after the last selected
// paragraph, which produces the same visual result in one .move() call
// and preserves styling/attributes of everything involved.

app.doScript(function () {
  var selection = app.selection[0];
  if (!selection) return;

  var paragraphs;
  try {
    paragraphs = selection.paragraphs;
  } catch (e) {
    return;
  }
  if (!paragraphs || paragraphs.length === 0) return;

  var firstPara = paragraphs.item(0);
  var lastPara = paragraphs.item(paragraphs.length - 1);

  // Locate the previous paragraph via the insertion point just before the
  // first selected paragraph — Paragraph has no stable id, so we navigate
  // through the story's insertion points (whose index is the character
  // offset in the story).
  var firstStartIndex = firstPara.insertionPoints.item(0).index;
  if (firstStartIndex === 0) return; // already at the top of the story

  var story = firstPara.parentStory;
  var prevPara = story.insertionPoints.item(firstStartIndex - 1).paragraphs.item(0);
  if (!prevPara.isValid) return;

  prevPara.move(LocationOptions.AFTER, lastPara);
}, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Move Paragraph Up");
