#include './utils.jsx'

var doc = app.activeDocument;

var karchagStyle = doc.paragraphStyles.itemByName("Karchag");
var karchagSectionStyle = doc.paragraphStyles.itemByName("Section Title Karchag");
if (!(karchagStyle.isValid && karchagSectionStyle.isValid)) {
    alert(
        "Before using this script you need to have: \n" +
        "- one paragraph styled \"Karchag\" where it will be auto-generated\n" +
        "- at least one paragraph styled as \"Section Title Karchag\"\n" +
        "\n" +
        "For adding section titles place your cursor inside the text of the beginning " +
        "of a section and run the script \"addSectionTitleAnchoredTextFrames.jsx\""
    );
} else {
    app.findGrepPreferences = app.changeGrepPreferences = null;
    app.findGrepPreferences.appliedParagraphStyle = karchagStyle;
    var karchagParagraph = app.activeDocument.findGrep()[0];
    
    if (!karchagParagraph) {
        alert(
            "The text frame for the karchag must not be empty.\n"+
            "Please initialize it with some text styled \"Karchag\"."
        );
    } else {
        app.findGrepPreferences = app.changeGrepPreferences = null;
        app.findGrepPreferences.appliedParagraphStyle = karchagSectionStyle;
        var sectionTitles = app.activeDocument.findGrep();

        var karchagContent = " ";
        for (var i = 0; i < sectionTitles.length; i++) {
            var sectionTitle = sectionTitles[i];
            var pageNumber = sectionTitle.parentTextFrames[0].parent.parentTextFrames[0].parentPage.name;
            karchagContent += tibetanNumber(pageNumber) + ' ' + sectionTitle.contents + '  ';
        }
        karchagParagraph.contents = karchagContent;
    }
}