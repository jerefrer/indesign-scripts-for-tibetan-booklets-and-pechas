var selection = app.selection[0];

if (selection && selection.contents) {
  var selectedParagraphs = selection.paragraphs;
  insertStyles(selectedParagraphs);
} else {
  for (var storyIndex = 0; storyIndex < document.stories.length; storyIndex++) {
    var story = document.stories.item(storyIndex);
    insertStyles(story.paragraphs);
  }
}

function insertStyles(paragraphs) {
    var styles = ["TIBETANO - estilos/TIBETANO", "FONÉTICAS/FONÉTICA", "ENGLISH/EN - TRANSLATION", "PORTUGUÊS/PT - TRADUÇÃO"];
    var paragraphs = paragraphs.everyItem().getElements();
    for (var i = 0; i < paragraphs.length; i++) {
        var stylePath = styles[i % styles.length];
        try {
            paragraphs[i].appliedParagraphStyle = findStyleByPath(stylePath, 'paragraph');
        } catch (e) {
            alert("Style " + stylePath + " does not exist.");
            break;
        }
    }
}

function findStyleByPath(stylePath, type) {
    var pathParts = stylePath.split('/');
    var currentCollection;
    if (type === 'paragraph') {
        currentCollection = document.paragraphStyles;
    } else if (type === 'character') {
        currentCollection = document.characterStyles;
    }
    for (var i = 0; i < pathParts.length; i++) {
        var part = pathParts[i];
        var foundStyleOrGroup = currentCollection.itemByName(part);
        if (!foundStyleOrGroup.isValid) {
            return null;
        }
        if (i < pathParts.length - 1) {
            currentCollection = foundStyleOrGroup.paragraphStyles;
        }
    }
    return foundStyleOrGroup;
}