var myDocument = app.activeDocument;

// Check if there is a text cursor or a text selection
if (app.selection.length > 0 && (app.selection[0].hasOwnProperty('parentStory') || app.selection[0].hasOwnProperty('insertionPoints'))) {
    var currentStory;

    // Determine the current story from the selection
    if (app.selection[0].hasOwnProperty('parentStory')) {
        currentStory = app.selection[0].parentStory;
    } else if (app.selection[0].hasOwnProperty('insertionPoints')) {
        currentStory = app.selection[0].insertionPoints[0].parentStory;
    }

    removeNewLines(currentStory);
    addSpaceAfterTsheg(currentStory);
    makeAllSpacesUnbreakable(currentStory)
    makeHardTshegsAfterNgas(currentStory);


    alert("Document processing complete.");
} else {
    alert("Please place the cursor inside text or make a text selection.");
}

// Function to remove new lines in the given story
function removeNewLines(myStory) {
    // Iterate backwards to avoid index issues after modifications
    for (var paraIndex = myStory.paragraphs.length - 2; paraIndex >= 0; paraIndex--) {
        var currentParagraph = myStory.paragraphs.item(paraIndex);
        var nextParagraph = myStory.paragraphs.item(paraIndex + 1);

        // Check if the last character is a paragraph symbol; if so, join paragraphs
        var lastChar = currentParagraph.characters.lastItem();
        if (lastChar.contents === '\r') {
            // Join this paragraph with the next one without losing styling
            lastChar.remove();
        }
    }
}

// Function to add space after Tsheg if not followed by a space in the given story
function addSpaceAfterTsheg(myStory) {
    app.findGrepPreferences = null;
    app.findGrepPreferences.findWhat = '།'; // Tibetan Tsheg character
    var foundItems = myStory.findGrep();

    for (var i = 0; i < foundItems.length; i++) {
        var currentItem = foundItems[i];
        var story = currentItem.parentStory;
        var currentIndex = currentItem.index;

        // Ensure not the last character in the story
        if (currentIndex < story.characters.length - 1) {
            var nextCharacter = story.characters.item(currentIndex + 1);

            // Now check if the currentItem is of size 28 and the next character is of size 38
            if (currentItem.pointSize == 28 && nextCharacter.pointSize == 38) {
                // Add a space after the currentItem if the condition is true
                currentItem.contents = currentItem.contents + ' ';
            }
        }
    }
}

function makeHardTshegsAfterNgas(myStory) {
    app.findGrepPreferences = app.changeGrepPreferences = null;

    app.findGrepPreferences.findWhat="ང་";
    app.changeGrepPreferences.changeTo="ང༌";
    myStory.changeGrep();
    
    app.findGrepPreferences.findWhat="་{2,}";
    app.changeGrepPreferences.changeTo="་";
    myStory.changeGrep();
}

function makeAllSpacesUnbreakable(myStory) {
    app.findGrepPreferences = app.changeGrepPreferences = null;

    app.findGrepPreferences.findWhat=" ";
    app.changeGrepPreferences.changeTo=" ";
    myStory.changeGrep();
}