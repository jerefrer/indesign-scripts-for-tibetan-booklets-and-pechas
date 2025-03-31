if (app.documents.length == 0) {
    alert("Please open a document first");
} else {
    var doc = app.activeDocument;
    var hyperlinks = doc.hyperlinks;
    
    // Create text content
    var content = "Hyperlinks List for: " + doc.name + "\n";
    content += "----------------------------------------\n\n";
    
    for (var i = 0; i < hyperlinks.length; i++) {
        try {
            var link = hyperlinks[i];
            var sourcePage = "--";
            var sourceFile = doc.name;
            var destFile = "--";
            var destPage = "--";
            
            // Get source info
            if (link.source && link.source.sourceText && link.source.sourceText.parentPage) {
                sourcePage = link.source.sourceText.parentPage.name;
            }
            
            // Get destination info
            if (link.destination) {
                if (link.destination.documentPath) {
                    destFile = link.destination.documentPath.name;
                }
                if (link.destination.pageNumber) {
                    destPage = link.destination.pageNumber;
                }
            }
            
            content += "Link: " + link.name + "\n";
            content += "Source File: " + sourceFile + "\n";
            content += "Source Page: " + sourcePage + "\n";
            content += "Destination File: " + destFile + "\n";
            content += "Destination Page: " + destPage + "\n";
            content += "----------------------------------------\n\n";
            
        } catch(e) {
            content += "Link: " + link.name + " (Error accessing details)\n";
            content += "----------------------------------------\n\n";
        }
    }
    
    // Save the file
    var file = File.saveDialog("Save hyperlinks list as:", "*.txt");
    if (file) {
        file.encoding = "UTF-8";
        file.open("w");
        file.write(content);
        file.close();
        alert("Hyperlinks list saved successfully!");
    }
}