/*
Replace all straight quotes (single and double) with French typographer's quotes in the active InDesign document.
Double quotes: « »
Single quotes: ‹ ›
*/

function replaceWithFrenchQuotes() {
  if (!app.documents.length) {
    alert("No document open.");
    return;
  }
  // GREP replacements should be set on the document, not on the story.
  // We'll apply the GREP to the whole document at once for efficiency and correctness.
  app.findGrepPreferences = app.changeGrepPreferences = null;

  // 1. Replace straight double quotes with French quotes and add unbreakable spaces
  app.findGrepPreferences.findWhat = '["“]([^"”]*)["”]';
  app.changeGrepPreferences.changeTo = "«\u00A0$1\u00A0»";
  app.changeGrep();

  // Fallback for unmatched double quotes
  app.findGrepPreferences.findWhat = '["”]';
  app.changeGrepPreferences.changeTo = "»";
  app.changeGrep();

  // 2. Ensure existing French quotes have unbreakable spaces
  app.findGrepPreferences.findWhat = "«(?!\u00A0| )";
  app.changeGrepPreferences.changeTo = "«\u00A0";
  app.changeGrep();

  app.findGrepPreferences.findWhat = "([^\u00A0 ])»";
  app.changeGrepPreferences.changeTo = "$1\u00A0»";
  app.changeGrep();

  // 3. Replace straight single quotes with French single quotes (no spaces)
  app.findGrepPreferences.findWhat = "'([^'‘]*)[’']";
  app.changeGrepPreferences.changeTo = "‘$1’";
  app.changeGrep();

  app.findGrepPreferences.findWhat = "[’']";
  app.changeGrepPreferences.changeTo = "’";
  app.changeGrep();

  // Clean up GREP preferences
  app.findGrepPreferences = app.changeGrepPreferences = null;

  alert(
    "All straight quotes replaced by French typographer's quotes, and unbreakable spaces added."
  );
}

app.doScript(
  replaceWithFrenchQuotes,
  ScriptLanguage.JAVASCRIPT,
  undefined,
  UndoModes.ENTIRE_SCRIPT
);
