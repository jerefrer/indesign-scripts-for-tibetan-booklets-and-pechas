// Enable extended features
#target "indesign"

try {
    // Check if there's an active document
    if (!app.documents.length) {
        throw new Error("No document is open.");
    }

    var doc = app.activeDocument;
    
    // Check if there's a text selection
    if (!app.selection.length || !(app.selection[0].hasOwnProperty("parentStory"))) {
        throw new Error("Please select some text first.");
    }

    // Get the selected text
    var sel = app.selection[0];
    
    // Start a transaction for undo functionality
    app.doScript(function() {
        // Process each paragraph in the selection
        var paragraphs = sel.paragraphs;
        
        for (var i = 0; i < paragraphs.length; i++) {
            var para = paragraphs[i];
            var currentStyle = para.appliedParagraphStyle;
            var currentStyleName = currentStyle.name;
            
            // Create the new style name
            var newStyleName = "Inserted " + currentStyleName;
            
            // Check if the style already exists
            var newStyle;
            try {
                newStyle = doc.paragraphStyles.itemByName(newStyleName);
                // Test if the style actually exists
                newStyle.name;
            } catch (e) {
                // Style doesn't exist, create it
                newStyle = doc.paragraphStyles.add({name: newStyleName});
            }
            
            // Apply the new style
            para.appliedParagraphStyle = newStyle;
        }
        
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Style Replacement");
    
    alert("Style replacement complete!\nProcessed " + sel.paragraphs.length + " paragraphs.");

} catch(e) {
    alert("Error: " + e.message);
}