main();

function main() {
  if (app.documents.length == 0) {
    alert("Please open a document first.");
    return;
  }

  var replacements = {
    བིགྷྣཱན: "བིན",
    བྷྱོ: "ོ",
    བྷྱ: "",
    གྷྲྀཧྞ: "",
    གྷྲཱིཧྣ: "ཱི",
    གྷྲིཧྣ: "ི",
    བྷྲཱུ: "",
    བིགྷྣཱྃ: "བི",
    བིགྷྣན: "བིན",
    དྷྱ: ""
  };

  var doc = app.activeDocument;

  app.findChangeTextOptions.includeMasterPages = false;
  app.findChangeTextOptions.includeFootnotes = false;
  app.findChangeTextOptions.includeHiddenLayers = false;
  app.findChangeTextOptions.wholeWord = false;

  for (var findText in replacements) {
    app.findGrepPreferences = null;
    app.changeGrepPreferences = null;

    app.findGrepPreferences.findWhat = findText;
    app.changeGrepPreferences.changeTo = replacements[findText];

    doc.changeGrep();
  }

  app.findGrepPreferences = null;
  app.changeGrepPreferences = null;

  alert("Replacements complete!");
}
