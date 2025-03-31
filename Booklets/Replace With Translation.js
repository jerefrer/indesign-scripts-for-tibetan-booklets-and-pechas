// @targetengine "translationSession"

// Store variables in the global scope for this engine
if (typeof translations == "undefined") {
  var translations = [];
}
if (typeof isInitialized == "undefined") {
  var isInitialized = false;
}
if (typeof lastTranslation == "undefined") {
  var lastTranslation = null;
}
if (typeof lastUndoState == "undefined") {
  var lastUndoState = {
      text: null,
      style: null,
      undoId: null
  };
}

var translationStyles = [
  "Verse Translation",
  "Yigchung Translation",
  "Inserted Verse Translation",
  "Inserted Yigchung Translation",
  "Heading 1",
  "Heading 2",
  "Heading 3",
  "Heading 2 Solo",
  "Insertion Frame",
  "Inserted Repetition Instructions"
];

function isInArray(array, item) {
  for (var i = 0; i < array.length; i++) {
      if (array[i] === item) return true;
  }
  return false;
}

function initialize() {
  // Get the translation file
  var translationFile = File.openDialog("Select the translation text file", "*.txt", false);
  if (!translationFile) return false;

  // Read and parse the translation file
  translationFile.open("r");
  var translationText = translationFile.read();
  translationFile.close();
  
  translations = translationText.split("\r").join("\n").split("\n\n").join("\n").split("\n");
  isInitialized = true;
  
  alert("Loaded " + translations.length + " lines from translation file");
  return true;
}

function findNextValidParagraph(doc, startPara) {
  var story = startPara.parent;
  var foundStart = false;
  
  // Search in current story first
  for (var i = 0; i < story.paragraphs.length; i++) {
      var para = story.paragraphs[i];
      
      // Skip until we find our starting paragraph
      if (para === startPara) {
          foundStart = true;
          continue;
      }
      
      if (foundStart && isInArray(translationStyles, para.appliedParagraphStyle.name)) {
          return para;
      }
  }
  
  // If not found in current story, search in subsequent stories
  var foundStory = false;
  for (var i = 0; i < doc.stories.length; i++) {
      var currentStory = doc.stories[i];
      
      // Skip until we find our current story
      if (currentStory === story) {
          foundStory = true;
          continue;
      }
      
      if (foundStory) {
          // Search in this story
          for (var j = 0; j < currentStory.paragraphs.length; j++) {
              var para = currentStory.paragraphs[j];
              if (isInArray(translationStyles, para.appliedParagraphStyle.name)) {
                  return para;
              }
          }
      }
  }
  
  return null;
}

// Keep track of last few operations for multiple undos
if (typeof undoHistory == "undefined") {
  var undoHistory = [];
}

function checkForUndo() {
  try {
      var doc = app.activeDocument;
      if (doc.selection.length > 0 && undoHistory.length > 0) {
          var currentPara = doc.selection[0].paragraphs[0];
          var currentContent = currentPara.contents.replace(/[\r\n]+$/, '');
          
          // Check if current content matches any of our stored states
          for (var i = undoHistory.length - 1; i >= 0; i--) {
              var state = undoHistory[i];
              if (currentContent === state.text) {
                  // Undo detected, restore all translations since this point
                  for (var j = undoHistory.length - 1; j >= i; j--) {
                      if (undoHistory[j].translation !== null) {
                          translations.unshift(undoHistory[j].translation);
                      }
                  }
                  
                  // Trim history to this point
                  undoHistory.length = i;
                  lastTranslation = null;
                  return true;
              }
          }
      }
  } catch (e) {
      // Ignore undo check errors
  }
  return false;
}

function resetState() {
  translations = [];
  isInitialized = false;
  lastTranslation = null;
  lastUndoState = {
      text: null,
      style: null,
      undoId: null
  };
}

function replaceAndAdvance() {
  // First check if there was an undo
  checkForUndo();
  
  if (!isInitialized) {
      if (!initialize()) return;
  }
  
  if (translations.length === 0) {
      alert("No more translations available!");
      return;
  }
  
  if (app.documents.length === 0) {
      alert("Please open a document first.");
      return;
  }
  
  var doc = app.activeDocument;
  
  // Get the current insertion point or selection
  var currentPara;
  try {
      if (doc.selection.length === 0) {
          alert("Please place the cursor in a paragraph first.");
          return;
      }
      
      // Get the parent paragraph of the current selection
      currentPara = doc.selection[0].paragraphs[0];
      
      // Verify the paragraph style
      if (!isInArray(translationStyles, currentPara.appliedParagraphStyle.name)) {
          alert("Current paragraph does not have one of the specified styles.");
          return;
      }
      
      // Store state for undo detection
      undoHistory.push({
          text: currentPara.contents.replace(/[\r\n]+$/, ''),
          translation: lastTranslation,
          style: currentPara.appliedParagraphStyle.name  // Store style name instead of ID
      });
      
      // Get and store the next translation
      lastTranslation = translations.shift();
      
      // Replace the text while preserving the paragraph break and style
      app.doScript(function() {
          var nextPara = findNextValidParagraph(doc, currentPara);
          
          // Store styles before making any changes
          var currentStyle = currentPara.appliedParagraphStyle;
          var nextParaStyle = nextPara ? nextPara.appliedParagraphStyle : null;
          
          // Do the replacement
          currentPara.contents = lastTranslation + "\r";
          
          // Force reapplication of styles
          app.doScript(function() {
              // Re-apply style to current paragraph
              currentPara.appliedParagraphStyle = currentStyle;
              
              // Re-apply style to next paragraph if it exists
              if (nextPara) {
                  nextPara.appliedParagraphStyle = nextParaStyle;
              }
          }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT);
          
          // Select the beginning of the next paragraph
          if (nextPara) {
              nextPara.characters[0].select();
          }
      }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT);
      
  } catch (e) {
      // If there's an error, put the translation back
      if (lastTranslation !== null) {
          translations.unshift(lastTranslation);
          lastTranslation = null;
      }
      alert("Error: " + e);
  }
}

// Check if Shift key is held while running the script
function main() {
  try {
      var keyState = ScriptUI.environment.keyboardState;
      
      // If Shift is held, reset state and force reinitialization
      if (keyState.shiftKey) {
          resetState();
          alert("State reset. Please select a new translation file.");
      }
      
      replaceAndAdvance();
  } catch (e) {
      alert("Error: " + e);
  }
}

// Main execution
main();