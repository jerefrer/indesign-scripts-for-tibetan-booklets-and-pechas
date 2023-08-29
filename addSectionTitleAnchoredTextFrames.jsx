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

    function addSectionTitleTextFrame(type, text) {
        var textFrame = doc.textFrames.add();
        textFrame.properties =
        {
           geometricBounds : [ 0,0,2,10 ],
           strokeWidth : 0,
           fillColor : "None",
           contents : text
        };
        textFrame.anchoredObjectSettings.insertAnchoredObject(cursorPosition, AnchorPosition.ANCHORED);
        textFrame.anchoredObjectSettings.anchorXoffset = 0;
        textFrame.anchoredObjectSettings.horizontalReferencePoint = AnchoredRelativeTo.PAGE_EDGE;
        textFrame.anchoredObjectSettings.verticalReferencePoint = VerticallyRelativeTo.PAGE_EDGE;
        if (type == "left") {
            textFrame.texts[0].applyParagraphStyle(sectionTitleLeftStyle);
            textFrame.anchoredObjectSettings.anchorPoint = AnchorPoint.BOTTOM_RIGHT_ANCHOR;
            textFrame.anchoredObjectSettings.anchorYoffset = 0;
        } else if (type == "right") {
            textFrame.texts[0].applyParagraphStyle(sectionTitleRightStyle);
            textFrame.anchoredObjectSettings.anchorPoint = AnchorPoint.TOP_RIGHT_ANCHOR;
            textFrame.anchoredObjectSettings.anchorYoffset = textFrame.parentPage.bounds[2];
        } else if (type == "center") {
            textFrame.texts[0].applyParagraphStyle(sectionTitleKarchakStyle);
            textFrame.anchoredObjectSettings.anchorPoint = AnchorPoint.RIGHT_CENTER_ANCHOR;
            textFrame.anchoredObjectSettings.anchorYoffset = textFrame.parentPage.bounds[2] / 2;
        }
    }

    addSectionTitleTextFrame("left", "བླ་ཕུར་");
    addSectionTitleTextFrame("right", "རྒྱུན་ཁྱེར།");
    addSectionTitleTextFrame("center", "བླ་ཕུར་རྒྱུན་ཁྱེར།");
}
 