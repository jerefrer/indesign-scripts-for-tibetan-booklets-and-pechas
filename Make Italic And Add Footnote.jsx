if (app.documents.length > 0 && app.selection.length > 0 && app.selection[0].hasOwnProperty("insertionPoints")) {
  var myDocument = app.activeDocument;
  var mySelection = app.selection[0];

  // Apply italic style to the selection
  mySelection.fontStyle = "Italic";

  // Get the current insertion point
  var insertionPoint = mySelection.insertionPoints[-1];

  // Create a new footnote
  app.scriptPreferences.enableRedraw = false; // Disable redraw for better performance
  var myFootnote = insertionPoint.footnotes.add();
  app.scriptPreferences.enableRedraw = true; // Enable redraw after footnote is added

  // Ensure the footnote text is selected and ready for typing
  var footnoteStory = myFootnote.texts[0];

  // Move the cursor to the end of the footnote text
  var footnoteInsertionPoint = footnoteStory.insertionPoints[-1];
  app.select(footnoteInsertionPoint);
}
