#include '../../lib/utils.jsx';

var doc = app.activeDocument;
var selection = app.selection[0];

var sectionTitleTranslationStyleName = "Running Header Translation";

var sectionTitleTibetanStyle = doc.paragraphStyles.itemByName(sectionTitleTranslationStyleName);
if (!sectionTitleTibetanStyle.isValid) {
    alert(
        "Before using this script you need to have defined the following styles:\n"+
        "- " + sectionTitleTranslationStyleName
    );
} else if (!selection) {
    alert("Position your cursor anywhere within the text that marks the beginning of the section");
} else {
    var cursorPosition = selection.insertionPoints[0];
    var page = selection.parentTextFrames[0].parentPage;
    var pageWidth = page.bounds[1];
    var pageHeight = page.bounds[2];
    var pageNumber = parseInt(page.name);

    function addSectionTitleTextFrame(text) {
        var textFrame = app.activeDocument.textFrames.add();
        textFrame.properties =
        {
            geometricBounds : [ 0, 0, 10, 90 ],
            strokeWidth : 0,
            fillColor : "None",
            contents : text
        };
        textFrame.anchoredObjectSettings.insertAnchoredObject(cursorPosition, AnchorPosition.ANCHORED);
        if (pageNumber % 2 == 0) {
            textFrame.anchoredObjectSettings.anchorXoffset = 0;
        } else {
            textFrame.anchoredObjectSettings.anchorXoffset = pageWidth * -1;
        }
        textFrame.anchoredObjectSettings.horizontalReferencePoint = AnchoredRelativeTo.PAGE_EDGE;
        textFrame.anchoredObjectSettings.verticalReferencePoint = VerticallyRelativeTo.PAGE_EDGE;

        textFrame.texts[0].applyParagraphStyle(sectionTitleTibetanStyle);
        textFrame.anchoredObjectSettings.anchorYoffset = 0;
        if (pageNumber % 2 == 0) {
            textFrame.anchoredObjectSettings.anchorPoint = AnchorPoint.BOTTOM_RIGHT_ANCHOR;
        } else {
            textFrame.anchoredObjectSettings.anchorPoint = AnchorPoint.BOTTOM_LEFT_ANCHOR;
        }
    }

    addSectionTitleTextFrame("SECTION TITLE");
}
