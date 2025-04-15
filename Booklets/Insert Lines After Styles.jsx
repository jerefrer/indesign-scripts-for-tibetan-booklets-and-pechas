#include "../lib/json2.js"
#include "../lib/styles-utils.js"

// Style mappings - keys are source style names, values are target style names to apply to inserted paragraphs
var STYLE_MAPPINGS = {
  "ENGLISH/EN - HEADING 1": "PORTUGUÊS/PT - HEADING 1",
  "ENGLISH/EN - HEADING 2": "PORTUGUÊS/PT - HEADING 2",
  "ENGLISH/EN - HEADINGS 3": "PORTUGUÊS/PT - HEADING 3",
  "ENGLISH/EN - TRANSLATION - commentary-verses": "PORTUGUÊS/PT - TRADUÇÃO - comentário-versos",
  "ENGLISH/EN - TRANSLATION - instructions": "PORTUGUÊS/PT - TRADUÇÃO - comentário",
  "ENGLISH/EN - TRANSLATION": "PORTUGUÊS/PT - TRADUÇÃO",
};

function createUI() {
    var doc = app.activeDocument;
    var dialog = new Window('dialog', 'Insert Lines After Styles');
    
    var scriptLabel = document.extractLabel("options");
    var options = scriptLabel ? JSON.parse(scriptLabel) : {};
    
    dialog.add('statictext', undefined, 'Paste your text here:');
    var textArea = dialog.add('edittext', undefined, options.textToInsert || '', {multiline: true, wantReturn: true});
    textArea.preferredSize = [300, 100];
    
    var buttons = dialog.add('group');
    buttons.alignment = 'right';
    buttons.add('button', undefined, 'Insert', { name: 'ok' });
    buttons.add('button', undefined, 'Cancel', { name: 'cancel' });
    
    var doInsert = false;
    
    if (dialog.show() === 1) {
        options = {
            textToInsert: textArea.text
        };
        // Process the text: remove leading/trailing newlines, replace multiple newlines with single ones
        var lines = textArea.text.replace(/^\n+/, '').replace(/\n+$/, '').replace(/\n{2,}/g, '\n').split('\n');
        // Create a new array with only non-empty lines
        var textToInsert = [];
        for (var i = 0; i < lines.length; i++) {
            // Check if line contains non-whitespace characters
            if (lines[i].replace(/\s+/g, '').length > 0) {
                textToInsert.push(lines[i]);
            }
        }
        doInsert = true;
    }
    dialog.close();
    
    document.insertLabel("options", JSON.stringify(options));
    
    if (doInsert) {
        app.doScript(function() {
            insertLinesAfterStyles(doc, textToInsert);
        }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT);
    }
}

function insertLinesAfterStyles(doc, linesToPaste) {
    var selection = doc.selection[0];
    
    if (selection && selection.hasOwnProperty('paragraphs')) {
        var paragraphs = selection.paragraphs;
        var matchedParagraphs = [];
        var matchedStyles = [];
        
        // First pass: identify paragraphs with styles in STYLE_MAPPINGS
        for (var i = 0; i < paragraphs.length; i++) {
            var paragraph = paragraphs[i];
            var stylePath = getStylePath(paragraph.appliedParagraphStyle);
            
            // Check if the style path is in STYLE_MAPPINGS and paragraph has content
            if (STYLE_MAPPINGS.hasOwnProperty(stylePath) && paragraph.contents.replace(/[ \n\r]/g, '').length) {
                // Find the target style
                var targetStylePath = STYLE_MAPPINGS[stylePath];
                var targetStyle = findStyleByPath(targetStylePath, 'paragraph');
                
                if (!targetStyle) {
                    alert("Could not find style: " + targetStylePath);
                    continue;
                }
                
                // Store information for this paragraph
                matchedParagraphs.push(paragraph);
                matchedStyles.push(targetStyle);
            }
        }
        
        // Check if we found any matching paragraphs
        if (matchedParagraphs.length === 0) {
            alert("No paragraphs with matching styles found in the selection.");
            return;
        }
        
        // Check if the number of lines matches the number of paragraphs
        if (matchedParagraphs.length !== linesToPaste.length) {
            alert("The number of lines to paste (" + linesToPaste.length + ") does not match the number of matching paragraphs (" + matchedParagraphs.length + ").");
            return;
        }
        
        // Process paragraphs in reverse order to maintain paragraph references
        var lineIndex = linesToPaste.length - 1;
        for (var j = paragraphs.length - 1; j >= 0; j--) {
            var paragraph = paragraphs[j];
            var stylePath = getStylePath(paragraph.appliedParagraphStyle);
            
            // Check if this paragraph has a matching style and has content
            if (STYLE_MAPPINGS.hasOwnProperty(stylePath) && paragraph.contents.replace(/[ \n\r]/g, '').length) {
                var targetStylePath = STYLE_MAPPINGS[stylePath];
                var targetStyle = findStyleByPath(targetStylePath, 'paragraph');
                
                if (!targetStyle) {
                    continue;
                }
                
                // Check if there's an existing paragraph with the target style after this one
                var foundExistingParagraph = false;
                
                // Find the next paragraph by using the text object instead of index
                try {
                    // Get the insertion point at the end of the paragraph
                    var endPoint = paragraph.insertionPoints[-1];
                    
                    // Check if there's text after this paragraph
                    if (endPoint.index < paragraph.parent.insertionPoints.length - 1) {
                        // Get the next insertion point
                        var nextPoint = paragraph.parent.insertionPoints[endPoint.index + 1];
                        
                        // Get the paragraph that contains this insertion point
                        if (nextPoint.paragraphs.length > 0) {
                            var nextParagraph = nextPoint.paragraphs[0];
                            
                            // Check if the next paragraph has the target style
                            if (nextParagraph.isValid && getStylePath(nextParagraph.appliedParagraphStyle) === targetStylePath) {
                                // Replace entire content with new content and ensure paragraph break
                                nextParagraph.contents = '';
                                nextParagraph.contents = linesToPaste[lineIndex] + "\r";
                                // Reapply the paragraph style to preserve styling
                                nextParagraph.appliedParagraphStyle = targetStyle;
                                foundExistingParagraph = true;
                            }
                        }
                    }
                } catch (e) {
                    // If there's an error finding the next paragraph, just continue with insertion
                }
                
                // If no existing paragraph with the target style was found, insert a new one
                if (!foundExistingParagraph) {
                    var insertionPoint = paragraph.insertionPoints[-1];
                    insertionPoint.contents = linesToPaste[lineIndex] + "\r";
                    
                    // Get the newly inserted paragraph and apply the style
                    var insertedText = insertionPoint.paragraphs[-1];
                    insertedText.appliedParagraphStyle = targetStyle;
                }
                
                lineIndex--;
            }
        }
    } else {
        alert("Please select all the lines where you want the text inserted.");
    }
}

createUI();
