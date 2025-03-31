main();

function main() {
    // Check if there is a selection
    if (app.selection.length === 0) {
        alert("Please select some text before running the script.");
        return;
    }

    // Get the current selection
    var selection = app.selection[0];
    
    // Check if the selection is text
    if (!(selection instanceof TextFrame) && !(selection instanceof InsertionPoint) && !(selection instanceof Text)) {
        alert("Please select text or a text frame.");
        return;
    }

    // Get all paragraphs in the selection
    var paragraphs = [];
    if (selection instanceof TextFrame) {
        paragraphs = selection.paragraphs;
    } else {
        paragraphs = selection.parentStory.paragraphs;
    }

    // Process paragraphs from end to start to avoid indexing issues
    for (var i = paragraphs.length - 1; i > 0; i--) {
        var currentPara = paragraphs[i];
        var prevPara = paragraphs[i - 1];

        try {
            // Check for "Mantra Phonetics" style
            if (currentPara.appliedParagraphStyle.name === "Mantra Phonetics") {
                prevPara.appliedParagraphStyle = app.activeDocument.paragraphStyles.itemByName("Mantra Tibetan");
            }
            
            // Check for "Inserted Mantra Phonetics" style
            if (currentPara.appliedParagraphStyle.name === "Inserted Mantra Phonetics") {
                prevPara.appliedParagraphStyle = app.activeDocument.paragraphStyles.itemByName("Inserted Mantra Tibetan");
            }
        } catch (e) {
            // Handle cases where style names don't exist
            alert("Error: Make sure all required paragraph styles exist in the document.\n" + e);
            return;
        }
    }
}