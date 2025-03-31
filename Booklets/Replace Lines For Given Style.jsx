#include "../lib/json2.js"
#include "../lib/styles-utils.js"

function createUI() {
    var doc = app.activeDocument;
    var dialog = new Window('dialog', 'Replaces Lines For Given Style');
    
    var scriptLabel = document.extractLabel("options");
    var options = scriptLabel ? JSON.parse(scriptLabel) : {};
    
    var allParagraphStyles = document.allParagraphStyles;
    
    dialog.add('statictext', undefined, '==========================');
    dialog.add('statictext', undefined, 'WARNING');
    dialog.add('statictext', undefined, '==========================');
    dialog.add('statictext', undefined, 'This is just a WORK IN PROGRESS');
    dialog.add('statictext', undefined, '==========================');
    dialog.add('statictext', undefined, 'Some lines will loose their styling.');
    dialog.add('statictext', undefined, 'You\'ll need to re-apply manually');
    dialog.add('statictext', undefined, '==========================');
    dialog.add('statictext', undefined, '');

    dialog.add('statictext', undefined, 'Paste your text here:');
    var textArea = dialog.add('edittext', undefined, options.textToInsert || '', {multiline: true, wantReturn: true});
    textArea.preferredSize = [640, 480];
    
    var targetStyleNameDropdown = addStyleDropdown(dialog, 'Replace lines of this style', allParagraphStyles, options.targetStyleName);
    
    var buttons = dialog.add('group');
    buttons.alignment = 'right';
    buttons.add('button', undefined, 'Replace', { name: 'ok' });
    buttons.add('button', undefined, 'Cancel', { name: 'cancel' });
    
    var doInsert = false;
    
    if (dialog.show() === 1) {
        options = {
            textToInsert: textArea.text,
            targetStyleName: targetStyleNameDropdown.selection && targetStyleNameDropdown.selection.text
        };
        var targetStyle = findStyleByPath(options.targetStyleName, 'paragraph');
        var textToInsert = textArea.text.replace(/^\n+/, '').replace(/\n+$/, '').replace(/\n{2,}/g, '\n').split('\n');
        doInsert = true;
    }
    dialog.close();
    
    document.insertLabel("options", JSON.stringify(options));
    
    if (doInsert) {
        replaceStyledParagraphs(doc, targetStyle, textToInsert);
    }
}

function replaceStyledParagraphs(doc, targetStyle, linesToPaste) {
    var selection = doc.selection[0];
    
    if (selection && selection.hasOwnProperty('paragraphs')) {
        var paragraphs = selection.paragraphs;
        var eligibleParagraphsCount = 0;
        var eligibleParagraphs = [];
        
        // First, collect all eligible paragraphs
        for (var i = 0; i < paragraphs.length; i++) {
            if (paragraphs[i].appliedParagraphStyle === targetStyle && 
                paragraphs[i].contents.replace(/[ \n\r]/g, '').length) {
                eligibleParagraphsCount++;
                eligibleParagraphs.push({
                    paragraph: paragraphs[i],
                    index: i,
                    nextStyle: (i < paragraphs.length - 1) ? paragraphs[i + 1].appliedParagraphStyle : null
                });
            }
        }
        
        if (eligibleParagraphsCount !== linesToPaste.length) {
            alert("The number of lines to paste does not match the number of target paragraphs. Expected " + 
                  eligibleParagraphsCount + " lines, but got " + linesToPaste.length + ".");
            return;
        }
        
        app.scriptPreferences.enableRedraw = false;
        
        try {
            // Process in reverse order
            for (var j = eligibleParagraphs.length - 1; j >= 0; j--) {
                var paragraphInfo = eligibleParagraphs[j];
                var paragraph = paragraphInfo.paragraph;
                
                if (paragraph.isValid) {
                    // Store the start and end of this paragraph
                    var startIndex = paragraph.insertionPoints[0].index;
                    var endIndex = paragraph.insertionPoints[-1].index;
                    
                    // Replace content in a single operation, keeping the paragraph break
                    paragraph.contents = linesToPaste[j] + "\r";
                    
                    // If there's a next paragraph, ensure it starts at endIndex + 1
                    if (paragraphInfo.nextStyle && paragraphInfo.index < paragraphs.length - 1) {
                        var nextParagraph = paragraphs[paragraphInfo.index + 1];
                        if (nextParagraph.isValid) {
                            nextParagraph.appliedParagraphStyle = paragraphInfo.nextStyle;
                        }
                    }
                }
            }
        } finally {
            app.scriptPreferences.enableRedraw = true;
        }
        
    } else {
        alert("Please select all the lines where you want the text inserted.");
    }
}

createUI();