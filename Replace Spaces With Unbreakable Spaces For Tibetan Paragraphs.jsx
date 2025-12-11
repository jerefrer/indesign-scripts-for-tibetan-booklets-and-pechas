(function () {
  if (app.documents.length === 0) {
    alert("Please open a document before running the script.");
    return;
  }

  var doc = app.activeDocument;
  var tibetanParagraphsCount = 0;
  var replacementsCount = 0;
  var nbsp = "\u00A0";

  try {
    app.findGrepPreferences = app.changeGrepPreferences = null;
    app.findGrepPreferences.findWhat = " ";
    app.changeGrepPreferences.changeTo = nbsp;

    var stories = doc.stories;
    for (var i = 0; i < stories.length; i++) {
      var story = stories[i];
      if (!story.isValid) {
        continue;
      }

      var paragraphs = story.paragraphs;
      for (var j = 0; j < paragraphs.length; j++) {
        var paragraph = paragraphs[j];
        var appliedStyle = paragraph.appliedParagraphStyle;
        if (!appliedStyle || !appliedStyle.isValid) {
          continue;
        }

        var styleName = (appliedStyle.name || "").toLowerCase();
        if (styleName.indexOf("tibetan") === -1) {
          continue;
        }

        var changeResults = paragraph.changeGrep();
        if (changeResults && changeResults.length) {
          replacementsCount += changeResults.length;
        }
        tibetanParagraphsCount++;
      }
    }
  } catch (error) {
    alert("Error: " + error.message);
    return;
  } finally {
    app.findGrepPreferences = app.changeGrepPreferences = null;
  }

  alert(
    "Processed " +
      tibetanParagraphsCount +
      " Tibetan paragraph(s). Converted " +
      replacementsCount +
      " space(s) to unbreakable spaces."
  );
})();
