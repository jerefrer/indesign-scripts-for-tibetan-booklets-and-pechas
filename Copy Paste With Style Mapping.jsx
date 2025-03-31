#include "./lib/polyfills.js"
#include "./lib/styles-utils.js"

/*
Script: Copy Paste With Style Mapping
Description: Takes text from clipboard with alternating styles (like phonetics and translations) 
             and replaces selected text in the current document, automatically mapping styles.
Author: Created based on user requirements
*/

// Main function
function main() {
    if (app.documents.length < 1) {
        alert("Please open a document.");
        return;
    }

    // Check if there's a text selection to replace
    if (app.selection.length === 0 || !(app.selection[0].hasOwnProperty("contents"))) {
        alert("Please select the text you want to replace.");
        return;
    }

    try {
        // Get the target selection that will be replaced
        var targetSelection = app.selection[0];
        
        // Store necessary information from the selection
        var targetDoc = app.activeDocument;
        var targetStory = targetSelection.parentStory;
        var selectionStart = targetSelection.index;
        var selectionEnd = selectionStart + targetSelection.length;
        
        // Analyze the target selection to detect existing styles
        var targetStyleInfo = analyzeTargetStyles(targetSelection);
        
        // Get clipboard content
        var clipboardText = GetClipboard();
        
        if (!clipboardText || clipboardText.trim() === "") {
            alert("No text found in clipboard. Please copy some text first.");
            return;
        }
        
        // Process the clipboard text to handle multiple lines of the same style
        var processedParagraphs = processClipboardText(clipboardText);
        
        // Apply the clipboard text with mapped styles
        applyWithStyleMapping(processedParagraphs, targetDoc, targetStory, selectionStart, selectionEnd, targetStyleInfo);
    } catch (e) {
        alert("Error: " + e.message);
    }
}

// Function to process clipboard text and handle multiple lines of the same style
function processClipboardText(clipboardText) {
    // Split text into raw paragraphs
    var rawParagraphs = clipboardText.split(/\r|\n/);
    
    // Process paragraphs to handle the pattern
    var processedParagraphs = [];
    var currentIndex = 0;
    
    while (currentIndex < rawParagraphs.length) {
        // Skip empty lines
        if (rawParagraphs[currentIndex].trim() === "") {
            currentIndex++;
            continue;
        }
        
        // Process phonetic line (odd index in the pattern)
        var phoneticText = rawParagraphs[currentIndex].trim();
        currentIndex++;
        
        // Add phonetic paragraph
        processedParagraphs.push({
            text: phoneticText,
            type: "phonetic"
        });
        
        // Process translation line(s) (even index in the pattern)
        if (currentIndex < rawParagraphs.length) {
            var translationLines = [];
            var translationText = "";
            
            // Collect all translation lines until we hit the next phonetic line
            // or end of text
            while (currentIndex < rawParagraphs.length) {
                var line = rawParagraphs[currentIndex];
                
                // Skip empty lines
                if (line.trim() === "") {
                    currentIndex++;
                    continue;
                }
                
                // Check if this is a continuation line (starts with tab or spaces)
                var isContinuation = line.match(/^[\t ]+/) !== null;
                
                // If we've already collected a translation line and this isn't a continuation,
                // and we're at an even-numbered line from the start, then this is likely 
                // the next phonetic line
                if (translationLines.length > 0 && !isContinuation && 
                    (processedParagraphs.length % 2 === 1)) {
                    break;
                }
                
                // Add this line to our translation lines
                if (isContinuation) {
                    // For continuation lines, remove leading whitespace
                    translationLines.push(line.replace(/^[\t ]+/, ""));
                } else {
                    translationLines.push(line.trim());
                }
                
                currentIndex++;
            }
            
            // Join all translation lines with spaces
            translationText = translationLines.join(" ");
            
            // Add translation paragraph
            processedParagraphs.push({
                text: translationText,
                type: "translation"
            });
        }
    }
    
    return processedParagraphs;
}

// Function to get text from clipboard using AppleScript/VBScript
function GetClipboard(){  
    var clipboard;  
    if(File.fs == "Macintosh"){  
        var script = 'tell application "Finder"\nset clip to the clipboard\nend tell\nreturn clip';  
        clipboard = app.doScript(script, ScriptLanguage.APPLESCRIPT_LANGUAGE);  
    } else {  
        var script = 'Set objHTML = CreateObject("htmlfile")\r'+  
        'returnValue = objHTML.ParentWindow.ClipboardData.GetData("text")';  
        clipboard = app.doScript(script, ScriptLanguage.VISUAL_BASIC);  
    }  
    return clipboard;  
}

// Function to analyze the target selection styles
function analyzeTargetStyles(targetSelection) {
    var styleInfo = {
        phoneticStyle: null,
        translationStyle: null
    };
    
    // Get paragraphs from selection
    var paragraphs = [];
    if (targetSelection.constructor.name === "Paragraph") {
        paragraphs.push(targetSelection);
    } else if (targetSelection.paragraphs && targetSelection.paragraphs.length > 0) {
        for (var i = 0; i < targetSelection.paragraphs.length; i++) {
            paragraphs.push(targetSelection.paragraphs[i]);
        }
    }
    
    // Analyze first two paragraphs to detect the pattern
    if (paragraphs.length >= 2) {
        styleInfo.phoneticStyle = paragraphs[0].appliedParagraphStyle;
        styleInfo.translationStyle = paragraphs[1].appliedParagraphStyle;
    } else if (paragraphs.length === 1) {
        // If only one paragraph, try to find another style in the document
        var style = paragraphs[0].appliedParagraphStyle;
        styleInfo.phoneticStyle = style;
        
        // Find another style in the document that's different
        var doc = app.activeDocument;
        var allStyles = [];
        getAllParagraphStyles(doc.paragraphStyles, allStyles);
        
        for (var i = 0; i < allStyles.length; i++) {
            if (allStyles[i] !== style) {
                styleInfo.translationStyle = allStyles[i];
                break;
            }
        }
    }
    
    // If we still don't have both styles, use default document styles
    if (!styleInfo.phoneticStyle || !styleInfo.translationStyle) {
        var doc = app.activeDocument;
        if (!styleInfo.phoneticStyle) {
            styleInfo.phoneticStyle = doc.paragraphStyles.item(0);
        }
        if (!styleInfo.translationStyle) {
            // Find a style that's different from the phonetic style
            for (var i = 0; i < doc.paragraphStyles.length; i++) {
                if (doc.paragraphStyles.item(i) !== styleInfo.phoneticStyle) {
                    styleInfo.translationStyle = doc.paragraphStyles.item(i);
                    break;
                }
            }
            // If we still don't have a translation style, use the same as phonetic
            if (!styleInfo.translationStyle) {
                styleInfo.translationStyle = styleInfo.phoneticStyle;
            }
        }
    }
    
    return styleInfo;
}

// Get all paragraph styles including those in style groups
function getAllParagraphStyles(styleCollection, result) {
    for (var i = 0; i < styleCollection.length; i++) {
        var style = styleCollection[i];
        
        // Add the style to the result
        result.push(style);
        
        // If this is a style group, recursively get its styles
        if (style.constructor.name === "ParagraphStyleGroup") {
            getAllParagraphStyles(style.paragraphStyles, result);
        }
    }
}

// Apply clipboard content with mapped styles
function applyWithStyleMapping(paragraphs, doc, story, selectionStart, selectionEnd, targetStyleInfo) {
    // Get the text to replace
    var textToReplace = story.characters.itemByRange(selectionStart, selectionEnd - 1);
    
    // Start an undo group
    app.doScript(function() {
        // Delete the selected text
        textToReplace.contents = "";
        
        // Get insertion point at the beginning of the selection
        var insertionPoint = story.insertionPoints[selectionStart];
        
        // Insert each paragraph with appropriate style
        for (var i = 0; i < paragraphs.length; i++) {
            var paraText = paragraphs[i].text;
            if (paraText.trim() === "") continue;
            
            // Determine which style to apply based on the paragraph type
            var targetStyle = (paragraphs[i].type === "phonetic") ? 
                targetStyleInfo.phoneticStyle : 
                targetStyleInfo.translationStyle;
            
            // Insert the text at the insertion point
            insertionPoint.contents = paraText;
            
            // Get the newly inserted text and apply the style
            var newTextEnd = selectionStart + paraText.length;
            var newText = story.characters.itemByRange(selectionStart, newTextEnd - 1);
            newText.appliedParagraphStyle = targetStyle;
            
            // Add a paragraph break if this is not the last paragraph
            if (i < paragraphs.length - 1) {
                story.insertionPoints[newTextEnd].contents = "\r";
                newTextEnd++;
            }
            
            // Update the insertion point and selection start for the next paragraph
            selectionStart = newTextEnd;
            insertionPoint = story.insertionPoints[selectionStart];
        }
    }, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Paste with Style Mapping");
}

// Run the script
main();
