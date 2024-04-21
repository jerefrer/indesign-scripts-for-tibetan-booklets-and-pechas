#include "./json2.js"
#include "./shared.js"

var document = app.activeDocument;
var scriptDirectory = File($.fileName).parent.fsName;

function openSettings() {
  var dialog = new Window('dialog', 'InsertPhonetics');
  var doInsertPhonetics = false;
  
  var allParagraphStyles = document.allParagraphStyles;
  var allCharacterStyles = document.allCharacterStyles;
  
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
  
  var smallLettersDropdown = addStyleDropdown(dialog, 'Small Letters Character Style (Optional)', [{name: 'None'}].concat(allCharacterStyles), selectedStyles.smallLetters); // Add this line
  
  function setDropdownSelectionWithNoneOption(dropdown, selectedStyle, styles) {
    var selectedIndex = findSelectedIndex(styles, selectedStyle);
    if (selectedIndex !== -1) {
      dropdown.selection = selectedIndex + 1;
    } else {
      dropdown.selection = 0; // Default selection to 'None'
    }
  }
  
  setDropdownSelectionWithNoneOption(mantraDropdown, selectedStyles.mantra, allParagraphStyles);
  setDropdownSelectionWithNoneOption(smallLettersDropdown, selectedStyles.smallLetters, allCharacterStyles);

  function setSelectedStyles() {
    selectedStyles = {
      tibetan: tibetanDropdown.selection && tibetanDropdown.selection.text,
      phonetics: phoneticsDropdown.selection && phoneticsDropdown.selection.text,
      mantra: mantraDropdown.selection && mantraDropdown.selection.text !== 'None' ? mantraDropdown.selection.text : null,
      smallLetters: smallLettersDropdown.selection && smallLettersDropdown.selection.text !== 'None' ? smallLettersDropdown.selection.text : null,
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
  
  var tibetanStyle = findStyleByPath(selectedStyles.tibetan, 'paragraph');
  var phoneticsStyle = findStyleByPath(selectedStyles.phonetics, 'paragraph');
  var mantraStyle = selectedStyles.mantra ? findStyleByPath(selectedStyles.mantra, 'paragraph') : null;
  var smallLettersCharacterStyle = selectedStyles.smallLetters ? findStyleByPath(selectedStyles.smallLetters, 'character') : null;
  
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
    var lines = paragraph.lines;
    var followingParagraph = paragraph.insertionPoints.item(-1).paragraphs[0];
    if (paragraph.appliedParagraphStyle === tibetanStyle && (!followingParagraph.isValid || followingParagraph.appliedParagraphStyle !== mantraStyle)) {
      var phonetics = generatePhoneticsForEachGroupSplitBySpace(ignoreSmallLetters(paragraph));
      if (phonetics.replace(/\s/g, '').length === 0) {
        return;
      }
      var insertionPoint = paragraph.insertionPoints.item(-1);
      insertionPoint.contents = "\r";
      var phoneticsParagraph = insertionPoint.paragraphs[0];
      if (phoneticsParagraph.isValid) {
        phoneticsParagraph.contents = phonetics + "\r";
        phoneticsParagraph.textStyleRanges[0].appliedCharacterStyle = findStyleByPath('[None]', 'character');
        phoneticsParagraph.appliedParagraphStyle = phoneticsStyle;
      } else {
        // If it's invalid, then it's the last line of the document.
        // I couldn't find a way to process it too, but that shouldn't happen most of the time anyway.
      }
    }
  }

  function ignoreSmallLetters(paragraph) {
    var textWithoutSmallLetters = '';
    for (var rangeIndex = 0; rangeIndex < paragraph.textStyleRanges.length; rangeIndex++) {
      var textStyleRange = paragraph.textStyleRanges.item(rangeIndex);
      var contents = textStyleRange.contents;
      if (contents.replace(/[ \r\n]+/g, '').length) {
        if (textStyleRange.appliedCharacterStyle === smallLettersCharacterStyle) {
          textWithoutSmallLetters += " ";
        } else {
          // If there are multiple lines, process only the first one
          // This happends because of the way InDesign handles textStyleRanges
          var firstLine = contents.replace(/([\r\n]+).*/, '$1');
          textWithoutSmallLetters += firstLine; 
        }
      }
    }
    return textWithoutSmallLetters;
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
    return array.join("   ").replace(/^ +/, ''); // remove leading spaces
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
