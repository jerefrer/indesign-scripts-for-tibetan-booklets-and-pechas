// Moves the paragraph containing the text cursor — or every paragraph
// touched by the current text selection — one paragraph down in its story.
// Implemented by moving the NEXT paragraph before the first selected
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

  // Locate the next paragraph via the insertion point just after the last
  // selected paragraph — Paragraph has no stable id, so we navigate through
  // the story's insertion points instead.
  var lastEndInsertionPoint = lastPara.insertionPoints.item(-1);
  var nextPara = lastEndInsertionPoint.paragraphs.item(0);
  if (!nextPara.isValid) return; // already at the bottom of the story

  // paragraphs.item(0) on the last insertion point of lastPara returns
  // lastPara itself when lastPara is the final paragraph — guard against that.
  if (nextPara.insertionPoints.item(0).index <= lastPara.insertionPoints.item(0).index) return;

  nextPara.move(LocationOptions.BEFORE, firstPara);
}, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Move Paragraph Down");
