#include "../lib/json2.js"
#include "../lib/styles-utils.js"

function createUI() {
    var doc = app.activeDocument;
    var dialog = new Window('dialog', 'Insert Lines Before/After Given Style');
    
    var scriptLabel = document.extractLabel("options");
    var options = scriptLabel ? JSON.parse(scriptLabel) : {};
    
    var allParagraphStyles = document.allParagraphStyles;
    
    dialog.add('statictext', undefined, 'Paste your text here:');
    var textArea = dialog.add('edittext', undefined, options.textToInsert || '', {multiline: true, wantReturn: true});
    textArea.preferredSize = [300, 100];
    
    var group = dialog.add('group');
    group.alignment = 'right';
    group.add('statictext', undefined, 'Insert this text line by line:');
    var positionDropdown = group.add('dropdownlist', undefined, ['Before', 'After']);
    positionDropdown.selection = insertionPosition === "Before" ? 0 : 1;
    
    var targetStyleNameDropdown = addStyleDropdown(dialog, 'Each paragraph of this style', allParagraphStyles, options.targetStyleName);
    var insertionStyleNameDropdown = addStyleDropdown(dialog, 'And apply each new line this style', allParagraphStyles, options.insertionStyleName);
    
    var buttons = dialog.add('group');
    buttons.alignment = 'right';
    buttons.add('button', undefined, 'Insert', { name: 'ok' });
    buttons.add('button', undefined, 'Cancel', { name: 'cancel' });
    
    var doInsert = false;
    
    if (dialog.show() === 1) {
        options = {
            textToInsert: textArea.text,
            targetStyleName: targetStyleNameDropdown.selection && targetStyleNameDropdown.selection.text,
            insertionStyleName: insertionStyleNameDropdown.selection && insertionStyleNameDropdown.selection.text,
            insertionPosition: positionDropdown.selection.text
        };
        var targetStyle = findStyleByPath(options.targetStyleName, 'paragraph');
        var insertionStyle = findStyleByPath(options.insertionStyleName, 'paragraph');
        var insertionPosition = positionDropdown.selection.text;
        var textToInsert = textArea.text.replace(/^\n+/, '').replace(/\n+$/, '').replace(/\n{2,}/g, '\n').split('\n');
        doInsert = true;
    }
    dialog.close();
    
    document.insertLabel("options", JSON.stringify(options));
    
    if (doInsert) {
        pasteBeforeStyledParagraphs(doc, targetStyle, textToInsert, insertionPosition, insertionStyle);
    }
}

function pasteBeforeStyledParagraphs(doc, targetStyle, linesToPaste, insertionPosition, insertionStyle) {
    var selection = doc.selection[0];

    if (!selection || !selection.hasOwnProperty('paragraphs')) {
        alert("Please select all the lines where you want the text inserted.");
        return;
    }

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

    // Wrap the whole mutation in ENTIRE_SCRIPT undo mode so a single Ctrl-Z
    // reverts every inserted paragraph at once.
    app.doScript(function () {
        var noneCharStyle = findStyleByPath('[None]', 'character');
        var lineIndex = linesToPaste.length - 1;
        for (var j = selection.paragraphs.length; j >= 0; --j) {
            var paragraph = selection.paragraphs[j];
            if (paragraph.isValid && paragraph.appliedParagraphStyle === targetStyle && paragraph.contents.replace(/[ \n\r]/g, '').length) {
                var insertionPoint;
                if (insertionPosition === "Before") {
                    insertionPoint = paragraph.insertionPoints[0];
                } else {
                    insertionPoint = paragraph.insertionPoints[-1];
                }
                insertionPoint.contents = linesToPaste[lineIndex] + "\r";
                var insertedText = (insertionPosition === "Before") ? insertionPoint.paragraphs[0] : insertionPoint.paragraphs[-1];
                insertedText.appliedParagraphStyle = insertionStyle;
                // Reset character styling per-character so the opening character
                // style of the adjacent paragraph cannot bleed into the newly
                // inserted line (happens mostly in the "After" case when the
                // insertion point sits at the start of the following paragraph).
                insertedText.characters.everyItem().appliedCharacterStyle = noneCharStyle;
                // clearOverrides wipes direct character formatting (pointSize,
                // font, horizontalScale, …) that the insertion point inherited
                // from the next paragraph's opening character — setting the
                // character style to [None] alone does not remove those.
                try {
                    insertedText.clearOverrides();
                } catch (e) {
                    // clearOverrides is available on Text-derived objects; ignore
                    // if the specific InDesign version disagrees.
                }
                lineIndex--;
            }
        }
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Insert Lines Before/After Given Style");
}

createUI();
