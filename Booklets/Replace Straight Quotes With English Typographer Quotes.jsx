/*
Replace all straight quotes (single and double) with English typographer's quotes in the active InDesign document.
Double quotes: “ ”
Single quotes: ‘ ’
*/

function replaceWithEnglishQuotes() {
    if (!app.documents.length) {
        alert('No document open.');
        return;
    }
    var doc = app.activeDocument;
    var stories = doc.stories;
    for (var i = 0; i < stories.length; i++) {
        var story = stories[i];
        // Replace double quotes
        story.contents = story.contents
            .replace(/\"([^"]*)\"/g, '“$1”')
            .replace(/\"/g, '”') // fallback for unmatched
            // Replace single quotes
            .replace(/\'([^']*)\'/g, '‘$1’')
            .replace(/\'/g, '’'); // fallback for unmatched
    }
    alert('All straight quotes replaced by English typographer\'s quotes.');
}

replaceWithEnglishQuotes();
