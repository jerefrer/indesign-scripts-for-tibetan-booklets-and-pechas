#include "./json2.js"

var document = app.activeDocument;

var scriptDirectory = File($.fileName).parent.fsName;

function openDialog() {
  var dialog = new Window('dialog', 'InsertPhonetics');
  var doInsertPhonetics = false;
  
  var allParagraphStyles = document.allParagraphStyles;
  
  function addStyleDropdown(dialog, label, styles, selectedStyle) {
    var group = dialog.add('group');
    group.add('statictext', undefined, label + ':');
    var dropdown = group.add('dropdownlist');
    group.alignment = 'right';
    for (var i = 0; i < styles.length; i++) {
      var stylePath = getStylePath(styles[i]);
      dropdown.add('item', stylePath);
    }
    if (selectedStyle) {
      var selectedIndex = findSelectedIndex(styles, selectedStyle);
      if (selectedIndex !== -1) {
        dropdown.selection = selectedIndex;
      }
    }
    return dropdown;
  }
  
  var scriptLabel = document.extractLabel("selectedStyles");
  var selectedStyles = scriptLabel ? JSON.parse(scriptLabel) : {};
  
  var tibetanDropdown = addStyleDropdown(dialog, 'Tibetan Style', allParagraphStyles, selectedStyles.tibetan);
  var phoneticsDropdown = addStyleDropdown(dialog, 'Phonetics Style', allParagraphStyles, selectedStyles.phonetics);
  var mantraDropdown = addStyleDropdown(dialog, 'Mantra Style (Optional)', [{name: 'None'}].concat(allParagraphStyles), selectedStyles.mantra);
  
  function setDropdownSelection(dropdown, selectedStyle) {
    var selectedIndex = findSelectedIndex(allParagraphStyles, selectedStyle);
    if (selectedIndex !== -1) {
      dropdown.selection = selectedIndex + 1;
    } else {
      dropdown.selection = 0; // Default selection to 'None'
    }
  }
  
  setDropdownSelection(mantraDropdown, selectedStyles.mantra);

  function setSelectedStyles() {
    selectedStyles = {
      tibetan: tibetanDropdown.selection && tibetanDropdown.selection.text,
      phonetics: phoneticsDropdown.selection && phoneticsDropdown.selection.text,
      mantra: mantraDropdown.selection && mantraDropdown.selection.text !== 'None' ? mantraDropdown.selection.text : null
    };
  }
  
  var buttonGroup = dialog.add('group');
  buttonGroup.alignment = 'right';
  
  var generateButton = buttonGroup.add('button', undefined, 'Generate', {name: 'generate'});
  generateButton.onClick = function() {
    setSelectedStyles();
    if (requiredStylesAreSelected(selectedStyles)) {
      doInsertPhonetics = true;
      dialog.close();
    } else {
      alert('Please select a Tibetan style and a Phonetics style.');
    }
  };
  
  var saveButton = buttonGroup.add('button', undefined, 'Save preferences', {name: 'ok'});
  saveButton.onClick = function() {
    setSelectedStyles();
    dialog.close();
  };
  
  dialog.show();
  
  document.insertLabel("selectedStyles", JSON.stringify(selectedStyles));
  if (doInsertPhonetics) {
    insertPhonetics(selectedStyles);
  }
}

function insertPhonetics(selectedStyles) {
  var selection = app.selection[0];
  
  var tibetanStyle = findStyleByPath(selectedStyles.tibetan);
  var phoneticsStyle = findStyleByPath(selectedStyles.phonetics);
  var mantraStyle = selectedStyles.mantra ? findStyleByPath(selectedStyles.mantra) : null;
  
  if (selection && selection.contents) {
    var selectedParagraphs = selection.paragraphs;
    
    for (var paragraphIndex = selectedParagraphs.length - 1; paragraphIndex >= 0; --paragraphIndex) {
      var paragraph = selectedParagraphs.item(paragraphIndex);
      processParagraph(paragraph);
    }
  } else {
    for (var storyIndex = 0; storyIndex < document.stories.length; storyIndex++) {
      var story = document.stories.item(storyIndex);
      
      for (var paragraphIndex = story.paragraphs.length - 1; paragraphIndex >= 0; --paragraphIndex) {
        var paragraph = story.paragraphs.item(paragraphIndex);
        processParagraph(paragraph);
      }
    }
  }
  
  function processParagraph(paragraph) {  
    var followingParagraph = paragraph.insertionPoints.item(-1).paragraphs[0];
    if (paragraph.appliedParagraphStyle === tibetanStyle && followingParagraph.appliedParagraphStyle !== mantraStyle) {
      var phonetics = generatePhoneticsForEachGroupSplitBySpace(paragraph.contents);
      
      var insertionPoint = paragraph.insertionPoints.item(-1);
      insertionPoint.contents = "\r";
      
      var phoneticsParagraph = insertionPoint.paragraphs[0];
      phoneticsParagraph.contents = phonetics + "\r";
      phoneticsParagraph.appliedParagraphStyle = phoneticsStyle;
    }
  }
  
  function generatePhoneticsForEachGroupSplitBySpace(text) {
    var groups = text.split(" ");
    var array = [];
    for (var i = 0; i < groups.length; i++) {
      var group = groups[i];
      var phonetics = generatePhoneticsFor(group);
      var capitalizedPhonetics = phonetics.charAt(0).toUpperCase() + phonetics.slice(1);
      array.push(capitalizedPhonetics);
    }
    return array.join("   ");
  }
  
  function generatePhoneticsFor(inputText) {
    var inputFilePath = "/tmp/phonetics_input.txt";
    var outputFilePath = "/tmp/phonetics_output.txt";
    var inputFile = new File(inputFilePath);
    var outputFile = new File(outputFilePath);
    
    inputFile.open("w");
    inputFile.encoding = "utf-8";
    inputFile.write(inputText);
    inputFile.close();
    
    var appleScript =
    'set inputPath to "/tmp/phonetics_input.txt"\r' +
    'set outputPath to "/tmp/phonetics_output.txt"\r' +
    'set perlLibPath to "' + scriptDirectory + '/Lingua-BO-Wylie/lib"\r' +
    'set perlScriptPath to "' + scriptDirectory + '/Lingua-BO-Wylie/bin/pronounce.pl"\r' +
    'set command to "perl -I" & quoted form of perlLibPath & " " & quoted form of perlScriptPath & " -sty padmakara-pt " & inputPath & " " & outputPath\r' +
    'set output to do shell script command\r' +
    'return output\r';
    app.doScript(appleScript, ScriptLanguage.APPLESCRIPT_LANGUAGE);
    
    outputFile.open("r");
    var result = outputFile.read();
    outputFile.close();
    
    return result.replace(/[\r\n]/g, '');
  }
}

// Private

function requiredStylesAreSelected(selectedStyles) {
  var tibetanExists = selectedStyles.tibetan && findStyleByPath(selectedStyles.tibetan);
  var phoneticsExists = selectedStyles.phonetics && findStyleByPath(selectedStyles.phonetics);
  return tibetanExists && phoneticsExists;
}
  
function findStyleByPath(stylePath) {
  var pathParts = stylePath.split('/');
  var currentCollection = document.paragraphStyles;
  for (var i = 0; i < pathParts.length; i++) {
    var part = pathParts[i];
    var foundStyleOrGroup = currentCollection.itemByName(part);
    if (!foundStyleOrGroup.isValid) {
      return null;
    }
    if (i < pathParts.length - 1) {
      currentCollection = foundStyleOrGroup.paragraphStyles;
    }
  }
  return foundStyleOrGroup;
}
  
function getStylePath(style) {
  var path = style.name;
  var parent = style.parent;
  while (parent && parent.constructor.name !== 'Document') {
    path = parent.name + '/' + path;
    parent = parent.parent;
  }
  return path;
}

function findSelectedIndex(styles, selectedStyle) {
  for (var i = 0; i < styles.length; i++) {
    var stylePath = getStylePath(styles[i]);
    if (stylePath === selectedStyle) {
      return i;
    }
  }
  return -1;
}