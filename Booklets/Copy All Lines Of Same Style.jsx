function copyParagraphsOfCurrentStyle() {
    if (!app.selection.length || !(app.selection[0] instanceof InsertionPoint || app.selection[0] instanceof Text)) {
        alert("Please place the cursor within a paragraph or select some text.");
        return;
    }

    var currentSelection = app.selection[0];
    var currentStyle;
    if (currentSelection.constructor.name === "InsertionPoint") {
        currentStyle = currentSelection.paragraphs[0].appliedParagraphStyle;
    } else if (currentSelection.constructor.name === "Text") {
        currentStyle = currentSelection.paragraphs[0].appliedParagraphStyle;
    } else {
        alert("Invalid selection. Please select text or place the cursor within text.");
        return;
    }

    var textToCopy = "";
    var doc = app.activeDocument;
    var sortedStories = doc.stories.everyItem().getElements().sort(function(a, b) {
        var aFirstFrame = a.textContainers[0];
        var bFirstFrame = b.textContainers[0];
        if (aFirstFrame.parentPage && bFirstFrame.parentPage) {
            if (aFirstFrame.parentPage.documentOffset !== bFirstFrame.parentPage.documentOffset) {
                return aFirstFrame.parentPage.documentOffset - bFirstFrame.parentPage.documentOffset;
            } else {
                return aFirstFrame.geometricBounds[0] - bFirstFrame.geometricBounds[0];
            }
        } else {
            return 0;
        }
    });
    for (var s = 0; s < sortedStories.length; s++) {
        var story = sortedStories[s];
        var paragraphs = story.paragraphs.everyItem().getElements();
        for (var i = 0; i < paragraphs.length; i++) {
            if (paragraphs[i].appliedParagraphStyle === currentStyle) {
                textToCopy += paragraphs[i].contents + "\r";
            }
        }
    }

    textToCopy = textToCopy.replace(/\r{2,}/g, '\r').replace(/\u0018/g, '');
    $.writeln(textToCopy);

    if (textToCopy) {
        var filePath = writeTextToFile(textToCopy);
        copyTextToClipboardWithAppleScript(filePath);
        alert("Text has been copied to the clipboard.");
    } else {
        alert("No paragraphs found with the style '" + currentStyle.name + "'.");
    }
}

function writeTextToFile(text) {
    var file = new File("/tmp/copy-lines-of-same-style.txt");
    file.open('w');
    file.encoding = "utf-8";
    file.write(text);
    file.close();
    return file.fsName;
}

function copyTextToClipboardWithAppleScript(filePath) {
    var appleScriptCommand = 'do shell script "cat \'' + filePath + '\' | LANG=en_US.UTF-8 pbcopy"';
    app.doScript(appleScriptCommand, ScriptLanguage.APPLESCRIPT_LANGUAGE);
}

copyParagraphsOfCurrentStyle();
