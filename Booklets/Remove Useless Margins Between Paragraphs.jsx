main();

// Removes top/bottom margins between paragraphs if they are of the same style
// For instance a list of mantras following one another or a long yigchung broken into multiple paragraphs
function main() {
  if (app.documents.length == 0) {
    alert("Please open a document first.");
    return;
  }

  // For instance if Mantra Phonetics is followed by Mantra Tibetan,
  // then remove spaceAfter on Mantra Phonetics, and spaceBefore on Mantra Tibetan
  var styleMap = {
    "Heading 1 Tibetan": "Heading 1 Translation",
    "Heading 1 Translation": "Heading 2 Translation",
    "Heading 2 Translation": "Yigchung Tibetan",
    "Heading 3 Translation": "Yigchung Tibetan",
    "Short Title Translation": "Heading 1 Tibetan",
    "Short Title Translation": "Heading 1 Translation",
    "Mantra Phonetics": "Mantra Tibetan",
    "Mantra Phonetics": "Yigchung Tibetan After",
    "Inserted Mantra Phonetics": "Inserted Mantra Tibetan",
    "Yigchung Translation": "Yigchung Tibetan",
    "Yigchung Verse Translation": "Yigchung Tibetan",
    "Inserted Yigchung Translation": "Inserted Yigchung Tibetan",
  };

  var doc = app.activeDocument;
  var allParagraphs = doc.stories
    .everyItem()
    .paragraphs.everyItem()
    .getElements();

  for (var i = 0; i < allParagraphs.length; i++) {
    var currentParagraph = allParagraphs[i];
    var nextParagraph =
      i < allParagraphs.length - 1 ? allParagraphs[i + 1] : null;
    var prevParagraph = i > 0 ? allParagraphs[i - 1] : null;

    var currentStyle = currentParagraph.appliedParagraphStyle.name;

    // Check if current style is in styleMap and next paragraph matches
    if (
      styleMap[currentStyle] &&
      nextParagraph &&
      nextParagraph.appliedParagraphStyle.name === styleMap[currentStyle]
    ) {
      currentParagraph.properties = { spaceAfter: 0 };
    }

    // Check if current style is a value in styleMap and previous paragraph is its key
    for (var key in styleMap) {
      if (
        styleMap[key] === currentStyle &&
        prevParagraph &&
        prevParagraph.appliedParagraphStyle.name === key
      ) {
        currentParagraph.properties = { spaceBefore: 0 };
        break;
      }
    }
  }

  alert("Margins updated successfully!");
}
