// Find consecutive paragraphs with Verse Phonetics styles
main();

function main() {
    // Check if a document is open
    if (app.documents.length == 0) {
        alert("Please open a document first.");
        return;
    }

    var doc = app.activeDocument;
    var foundCount = 0;
    var currentIndex = 0;

    // Array to store all matching paragraphs
    var matches = [];

    // Get all stories in the document
    for (var i = 0; i < doc.stories.length; i++) {
        var story = doc.stories[i];
        
        // Check each paragraph in the story
        for (var j = 0; j < story.paragraphs.length - 1; j++) {
            var currentPara = story.paragraphs[j];
            var nextPara = story.paragraphs[j + 1];
            
            // Check if both current and next paragraphs have one of the target styles
            if (isTargetStyle(currentPara) && isTargetStyle(nextPara)) {
                matches.push({
                    paragraph: currentPara,
                    storyIndex: i,
                    paraIndex: j
                });
                foundCount++;
            }
        }
    }

    // If no matches found, alert user and exit
    if (foundCount === 0) {
        alert("No consecutive paragraphs with Verse Phonetics styles found.");
        return;
    }

    // Create dialog for navigation
    var dialog = new Window("dialog", "Navigate Consecutive Verse Phonetics");
    dialog.orientation = "column";
    
    // Add count information
    dialog.add("statictext", undefined, "Found " + foundCount + " instances");
    dialog.add("statictext", undefined, "Currently viewing: 1 of " + foundCount);
    
    // Add navigation buttons
    var btnGroup = dialog.add("group");
    var prevBtn = btnGroup.add("button", undefined, "Previous");
    var nextBtn = btnGroup.add("button", undefined, "Next");
    var closeBtn = btnGroup.add("button", undefined, "Close");
    
    // Initially disable previous button
    prevBtn.enabled = false;
    
    // Button functionality
    prevBtn.onClick = function() {
        currentIndex--;
        selectMatch(matches[currentIndex]);
        updateDialog();
    }
    
    nextBtn.onClick = function() {
        currentIndex++;
        selectMatch(matches[currentIndex]);
        updateDialog();
    }
    
    closeBtn.onClick = function() {
        dialog.close();
    }
    
    // Function to update button states and count display
    function updateDialog() {
        prevBtn.enabled = currentIndex > 0;
        nextBtn.enabled = currentIndex < matches.length - 1;
        dialog.children[1].text = "Currently viewing: " + (currentIndex + 1) + " of " + foundCount;
    }
    
    // Select first match
    selectMatch(matches[0]);
    
    // Show dialog
    dialog.show();
}

function isTargetStyle(paragraph) {
    try {
        var styleName = paragraph.appliedParagraphStyle.name;
        return (styleName === "Verse Phonetics" || styleName === "Inserted Verse Phonetics");
    } catch(e) {
        return false;
    }
}

function selectMatch(match) {
    try {
        // Get the text frame containing the paragraph
        var textFrame = match.paragraph.parentTextFrames[0];
        
        if (textFrame && textFrame.parentPage) {
            // Get the spread containing the page
            var spread = textFrame.parentPage.parent;
            
            // Make the spread visible in the active window
            app.activeWindow.activeSpread = spread;
            
            // Select and show the paragraph
            app.select(match.paragraph);
            match.paragraph.showText();
        }
    } catch(e) {
        alert("Error navigating to paragraph: " + e);
    }
}