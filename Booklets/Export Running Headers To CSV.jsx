#target "InDesign"

(function () {
    if (!app.documents.length) {
        alert("Open a document before running this script.");
        return;
    }

    var doc = app.activeDocument;
    var styleName = "Short Title Translation";
    
    var targetStyle = doc.paragraphStyles.itemByName(styleName);
    if (!targetStyle.isValid) {
        alert("Paragraph style \"" + styleName + "\" was not found in this document.");
        return;
    }

    // Build a map of page -> running header text
    // The running header for a page is the last "Short Title Translation" paragraph 
    // that appears on or before that page
    var pageHeaders = {};
    var currentHeader = "";
    
    // Get all pages
    var pages = doc.pages.everyItem().getElements();
    
    // For each page, find all text frames and look for the style
    for (var p = 0; p < pages.length; p++) {
        var page = pages[p];
        var pageName = page.name;
        
        // Get all text frames on this page
        var textFrames = page.textFrames.everyItem().getElements();
        
        for (var t = 0; t < textFrames.length; t++) {
            var frame = textFrames[t];
            var paragraphs = frame.paragraphs.everyItem().getElements();
            
            for (var i = 0; i < paragraphs.length; i++) {
                var para = paragraphs[i];
                if (para.appliedParagraphStyle === targetStyle) {
                    // Update current header (strip trailing whitespace/newlines)
                    currentHeader = para.contents.replace(/[\r\n\u0018]+$/g, '').replace(/^\s+|\s+$/g, '');
                }
            }
        }
        
        // Store the current header for this page
        pageHeaders[pageName] = currentHeader;
    }

    // Build CSV content
    var csvContent = "Page,Running Header\n";
    for (var p = 0; p < pages.length; p++) {
        var pageName = pages[p].name;
        var header = pageHeaders[pageName] || "";
        // Escape quotes in CSV
        header = header.replace(/"/g, '""');
        csvContent += pageName + ",\"" + header + "\"\n";
    }

    // Copy to clipboard
    var filePath = writeTextToFile(csvContent);
    copyTextToClipboardWithAppleScript(filePath);
    
    alert("Running headers for " + pages.length + " pages copied to clipboard as CSV.");
})();

function writeTextToFile(text) {
    var file = new File("/tmp/running-headers-export.csv");
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
