main();

function main() {
  if (app.documents.length == 0) {
    alert("Please open a document first.");
    return;
  }

  var replacements = {
    གྷྣཱ: "",
    གྷྣ: "",
    བྷྲཱུ: "",
    བྷྲཱ: "",
    བྷྲ: "",
    བྷྱ: "",
    བྷྭ: "",
    བྷྞ: "",
    བྷྣ: "",
    བྷྨ: "",
    བྷ: "",
    གྷྲ: "",
    རྒྷྱ: "",
    རྒྷ: "",
    རྡྡྷྱ: "",
    རྡྡྷ: "",
    ཛྷྫྷ: "",
    ཛྷྭ: "",
    ཛྷྱ: "",
    ཛྷྲ: "",
    བྡྷྭ: "",
    བྦྷྱ: "",
    བྷྞ: "",
    བྷྣ: "",
    བྷྨ: "",
    མྦྷྱ: "",
    ཀྵྞ: "",
    ཀྵྼ: "",
    ཀྵྨྱ: "",
    ཀྵྨ: "",
    ཀྵྭ: "",
    ཀྵླ: "",
    // དྷྲ: "", // Seems unnecessary since དྷ supports rata
    // དྷྱ: "", // Seems unnecessary since དྷ supports yata
    // དྷྭ: "", // Seems unnecessary since དྷ supports wasur
    དྷ: "དྷ",
    དྡྷྱ: "",
    དྡྷྭ: "",
    དྡྷ: "",
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
