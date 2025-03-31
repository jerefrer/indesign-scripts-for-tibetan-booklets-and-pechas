if (app.documents.length > 0 && app.selection.length > 0) {
    var doc = app.activeDocument;
    var sel = app.selection[0];
    
    app.doScript(function() {
        // Function to reduce a measurement by 5%
        function reduceBy5Percent(value) {
            return value * 0.95;
        }
        
        // Process the selection
        if (sel.constructor.name === "InsertionPoint" || 
            sel.constructor.name === "Text" || 
            sel.constructor.name === "TextColumn" || 
            sel.constructor.name === "TextFrame" || 
            sel.constructor.name === "Story") {
            
            // Get all paragraphs in the selection
            var paragraphs = sel.paragraphs;
            
            for (var i = 0; i < paragraphs.length; i++) {
                var para = paragraphs[i];
                
                // Adjust leading (line height)
                if (para.leading !== Leading.AUTO) {
                    para.leading = reduceBy5Percent(para.leading);
                }
                
                // Adjust space before
                if (para.spaceBefore !== 0) {
                    para.spaceBefore = reduceBy5Percent(para.spaceBefore);
                }
                
                // Adjust space after
                if (para.spaceAfter !== 0) {
                    para.spaceAfter = reduceBy5Percent(para.spaceAfter);
                }
            }
        } else {
            alert("Please select some text.");
        }
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT);
} else {
    alert("Please open a document and select some text.");
}