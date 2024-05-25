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
        
        for (var i = 0; i < paragraphs.length; i++) {
            if (paragraphs[i].appliedParagraphStyle === targetStyle && paragraphs[i].contents.replace(/[ \n\r]/g, '').length) {
                eligibleParagraphsCount++;
            }
        }
        
        if (eligibleParagraphsCount !== linesToPaste.length) {
            alert("The number of lines to paste does not match the number of target paragraphs. Expected " + eligibleParagraphsCount + " lines, but got " + linesToPaste.length + ".");
            return;
        }
        
        var lineIndex = linesToPaste.length - 1;
        for (var j = selection.paragraphs.length; j >= 0; --j) {
            var paragraph = selection.paragraphs[j];
            if (paragraph.isValid && paragraph.appliedParagraphStyle === targetStyle && paragraph.contents.replace(/[ \n\r]/g, '').length) {
                paragraph.contents = linesToPaste[lineIndex] + "\r";
                lineIndex--;
            }
        }
        
    } else {
        alert("Please select all the lines where you want the text inserted.");
    }
}

createUI();
