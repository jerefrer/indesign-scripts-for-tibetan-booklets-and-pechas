#include '../../lib/utils.jsx';

var pageOffset = 3;

var doc = app.activeDocument;
var sectionTitleStyle = doc.paragraphStyles.itemByName("Running head TIB");

function createHyperlink(doc, destination, source, name) {
    var destinationNextChar = destination.characters[destination.characters.length - 1].insertionPoints[0];
    var hyperlinkSource = doc.hyperlinkTextSources.add(source);
    var hyperlinkDestination = doc.hyperlinkTextDestinations.add(destinationNextChar);
    doc.hyperlinks.add(hyperlinkSource, hyperlinkDestination, {
        name: name,
        visible: true
    });
}

function createBookmark(doc, text) {
    var bookmarkDestination = doc.hyperlinkTextDestinations.add(text);
    doc.bookmarks.add(bookmarkDestination);
}

var myDoc = app.activeDocument;
var allObjects = myDoc.allPageItems;
var anchoredItems = [];

for (var i = 0; i < allObjects.length; i++) {
    if (allObjects[i].parent.constructor.name == "Character") {
        anchoredItems.push(allObjects[i]);
    }
}

var tocFrame;

for (var i = 0; i < doc.textFrames.length; i++) {
    var textFrame = doc.textFrames[i];
    if (textFrame.label === 'TOC') {
        tocFrame = textFrame;
        break;
    }
}

if (!tocFrame) {
    alert("Please create a text frame with Script Label 'TOC'");
    exit();
}

tocFrame.contents = '';
doc.bookmarks.everyItem().remove();

var sectionTitles = {};

for (var j = 0; j < anchoredItems.length; j++) {
    var anchoredItem = anchoredItems[j];
    if (anchoredItems[j].paragraphs[0].appliedParagraphStyle == sectionTitleStyle) {
        var parentCharacter = anchoredItem.parent;

        var sectionTitle = anchoredItem.contents;
        if (!sectionTitles[sectionTitle]) {
            sectionTitles[sectionTitle] = 1;
        } else {
            sectionTitles[sectionTitle]++;
            sectionTitle += ' ༿' + tibetanNumber(sectionTitles[sectionTitle]) + '༾';
        }

        createBookmark(doc, anchoredItem.parent, sectionTitle);

        var insertionPoint = tocFrame.insertionPoints.lastItem();
        insertionPoint.contents = "\r";
        var pageNumber = parseInt(anchoredItem.parent.parentTextFrames[0].parentPage.name) - pageOffset;
        var pageNumberInTibetan = false;
        if (pageNumberInTibetan) {
            pageNumber = tibetanNumber(pageNumber);
            tocFrame.contents += pageNumber + '\t' + sectionTitle;
        } else {
            var pageNumberText = tocFrame.insertionPoints[-1].contents = pageNumber + '\t';
            var pageNumberRange = tocFrame.characters.itemByRange(tocFrame.characters.length - pageNumberText.length, tocFrame.characters.length - 2); // -2 to exclude the tab character
            pageNumberRange.appliedCharacterStyle = app.activeDocument.characterStyles.item("Page number in karchag");
            tocFrame.insertionPoints[-1].contents = sectionTitle;
        }
        createHyperlink(doc, parentCharacter, tocFrame.paragraphs.lastItem(), sectionTitle);

        if (j == anchoredItems.length - 1) {
            createBookmark(doc, parentCharacter, "DUMMY BOOKMARK");
        }
    }
}

for (var j = 0; j < anchoredItems.length; j++) {
    var anchoredItem = anchoredItems[j];
    if (anchoredItems[j].paragraphs[0].appliedParagraphStyle == sectionTitleStyle) {
        doc.bookmarks[j].name = anchoredItem.contents;
    }
}

// Remove the first new line inserted at the beginning to help build paragraphs
tocFrame.characters.firstItem().remove();

// We need to create and then remove DUMMY BOOKMARK.
// Without this the last is named "Anchor N".
// Don't ask why.
doc.bookmarks.lastItem().remove();