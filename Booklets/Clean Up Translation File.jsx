main();

function main() {
    if (app.documents.length == 0) {
        alert("Please open a document first.");
        return;
    }

    var doc = app.activeDocument;
    var parasToDelete = [];
    var skipNext = false;

    // Loop through all stories
    for (var i = 0; i < doc.stories.length; i++) {
        var story = doc.stories[i];
        
        // Loop through paragraphs
        for (var j = 0; j < story.paragraphs.length - 1; j++) {
            // Skip if this paragraph was part of a previously processed pair
            if (skipNext) {
                skipNext = false;
                continue;
            }

            var currentPara = story.paragraphs[j];
            var nextPara = story.paragraphs[j + 1];
            var currentStyle = currentPara.appliedParagraphStyle.name;
            var nextStyle = nextPara.appliedParagraphStyle.name;

            // Check if we have a pair of matching target styles
            if ((currentStyle === "Verse Translation" || currentStyle === "Yigchung Translation") &&
                currentStyle === nextStyle) {
                // Mark first paragraph of the pair for deletion
                parasToDelete.push(currentPara);
                // Skip the next paragraph in our iteration
                skipNext = true;
            }
        }
    }

    // Delete marked paragraphs in reverse order
    for (var k = parasToDelete.length - 1; k >= 0; k--) {
        parasToDelete[k].remove();
    }

    alert("Completed. Removed " + parasToDelete.length + " paragraphs.");
}