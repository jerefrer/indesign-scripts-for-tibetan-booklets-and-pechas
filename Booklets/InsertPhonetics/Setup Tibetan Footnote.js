#include "../../lib/json2.js"
#include "../../lib/styles-utils.js"

var document = app.activeDocument;
var scriptDirectory = File($.fileName).parent.fsName;

function setupTibetanFootnote() {
  var selection = app.selection[0];

  if (!isPerlAvailable()) {
    alert('Perl is not available.\n\nInstall perl with "brew install perl" and try again.');
    return;
  }
  
  if (selection && selection.contents) {
    // Apply TibetanChogyalUnicode font to the selected text
    selection.appliedFont = "TibetanChogyalUnicode";
    selection.pointSize = 16;
    selection.leading = 17;

    // Get the current text as a string
    var tibetanText = selection.contents;

    // Generate Wylie transliteration
    var wylieText = generateWylieFor(tibetanText).replace(/\*/g, ' ');

    // Create the combined text with Tibetan and Wylie
    var combinedText = tibetanText + "  " + wylieText;

    // Replace the selected text with the combined text
    selection.contents = combinedText;

    // Footnote number offset
    var tibetanStart = selection.parent.contents.indexOf(tibetanText);

    // Apply TibetanChogyalUnicode font to the Tibetan part
    tibetanPart = selection.parent.characters.itemByRange(tibetanStart, tibetanStart + tibetanText.length - 1);
    tibetanPart.appliedFont = "TibetanChogyalUnicode-170221";
    tibetanPart.pointSize = 16;
    tibetanPart.leading = 17;
    tibetanPart.baselineShift = 6;

    // Apply Times New Roman, italic to the spaces and Wylie part
    var latinPart = selection.parent.characters.itemByRange(tibetanStart + tibetanText.length, -1);
    latinPart.appliedFont = "Times New Roman";
    latinPart.fontStyle = "Italic";
    latinPart.pointSize = 9;
    latinPart.leading = 17;
  }
}
  
function generateWylieFor(inputText) {
  var inputFilePath = "/tmp/wylie_input.txt";
  var outputFilePath = "/tmp/wylie_output.txt";
  var inputFile = new File(inputFilePath);
  var outputFile = new File(outputFilePath);
  
  inputFile.open("w");
  inputFile.encoding = "utf-8";
  inputFile.write(inputText);
  inputFile.close();
  
  var appleScript =
  'set inputPath to "/tmp/wylie_input.txt"\r' +
  'set outputPath to "/tmp/wylie_output.txt"\r' +
  'set perlLibPath to "' + scriptDirectory + '/lib/Lingua-BO-Wylie/lib"\r' +
  'set perlScriptPath to "' + scriptDirectory + '/lib/Lingua-BO-Wylie/bin/wylie.pl"\r' +
  'set command to "perl -I" & quoted form of perlLibPath & " " & quoted form of perlScriptPath & " -u " & inputPath & " " & outputPath\r' +
  'set output to do shell script command\r' +
  'return output\r';
  app.doScript(appleScript, ScriptLanguage.APPLESCRIPT_LANGUAGE);
  
  outputFile.open("r");
  var result = outputFile.read();
  outputFile.close();
  
  return result.replace(/[\r\n]/g, '');
}

function isPerlAvailable() {
  var appleScript =
      'try\r' +
      '    do shell script "which perl "\r' +
      '    return true\r' +
      'on error\r' +
      '    return false\r' +
      'end try';

  var isAvailable = app.doScript(appleScript, ScriptLanguage.APPLESCRIPT_LANGUAGE);

  return isAvailable;
}

setupTibetanFootnote();