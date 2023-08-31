#include './utils.jsx'

var doc = app.activeDocument;
var selection = app.selection[0];

var sectionTitleLeftStyle = doc.paragraphStyles.itemByName("Section Title Left");
var sectionTitleRightStyle = doc.paragraphStyles.itemByName("Section Title Right");
var sectionTitleKarchakStyle = doc.paragraphStyles.itemByName("Section Title Karchag");
if (!(sectionTitleLeftStyle.isValid && sectionTitleRightStyle.isValid && sectionTitleKarchakStyle.isValid)) {
    alert(
        "Before using this script you need to have defined the following styles:\n"+
        "- Section Title Left\n"+
        "- Section Title Right\n"+
        "- Section Title Karchag"
    );
} else if (!selection) {
    alert("Position your cursor anywhere within the text that marks the beginning of the section");
} else {
    var cursorPosition = selection.insertionPoints[0];
    var page = selection.parentTextFrames[0].parentPage;
    var pageWidth = page.bounds[1];
    var pageHeight = page.bounds[2];
    var pageNumber = parseInt(page.name);

    function addSectionTitleTextFrame(type, text) {
        var textFrame = doc.textFrames.add();
        textFrame.properties =
        {
            geometricBounds : [ 0, 0, 1, 3 ],
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
        if (type == "left") {
            textFrame.texts[0].applyParagraphStyle(sectionTitleLeftStyle);
            textFrame.anchoredObjectSettings.anchorYoffset = 0;
            if (pageNumber % 2 == 0) {
                textFrame.anchoredObjectSettings.anchorPoint = AnchorPoint.BOTTOM_RIGHT_ANCHOR;
            } else {
                textFrame.anchoredObjectSettings.anchorPoint = AnchorPoint.BOTTOM_LEFT_ANCHOR;
            }
        } else if (type == "right") {
            textFrame.texts[0].applyParagraphStyle(sectionTitleRightStyle);
            textFrame.anchoredObjectSettings.anchorYoffset = pageHeight;
            if (pageNumber % 2 == 0) {
                textFrame.anchoredObjectSettings.anchorPoint = AnchorPoint.TOP_RIGHT_ANCHOR;
            } else {
                textFrame.anchoredObjectSettings.anchorPoint = AnchorPoint.TOP_LEFT_ANCHOR;
            }
        } else if (type == "center") {
            textFrame.texts[0].applyParagraphStyle(sectionTitleKarchakStyle);
            textFrame.anchoredObjectSettings.anchorYoffset = pageHeight / 2;
            if (pageNumber % 2 == 0) {
                textFrame.anchoredObjectSettings.anchorPoint = AnchorPoint.RIGHT_CENTER_ANCHOR;
            } else {
                textFrame.anchoredObjectSettings.anchorPoint = AnchorPoint.LEFT_CENTER_ANCHOR;
            }
        }
    }

    addSectionTitleTextFrame("left", "བླ་ཕུར་");
    addSectionTitleTextFrame("right", "རྒྱུན་ཁྱེར།");
    addSectionTitleTextFrame("center", "བླ་ཕུར་རྒྱུན་ཁྱེར།");
}
