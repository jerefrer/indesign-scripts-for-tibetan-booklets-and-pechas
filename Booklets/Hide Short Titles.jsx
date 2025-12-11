#target "InDesign"

(function () {
    if (!app.documents.length) {
        alert("Open a document before running this script.");
        return;
    }

    var doc = app.activeDocument;
    var paragraphStyleName = "Running Header";
    var conditionName = "Running Header";

    var targetStyle = doc.paragraphStyles.itemByName(paragraphStyleName);
    if (!targetStyle.isValid) {
        alert("Paragraph style \"" + paragraphStyleName + "\" was not found in this document.");
        return;
    }

    var targetCondition;
    try {
        targetCondition = doc.conditions.itemByName(conditionName);
        if (!targetCondition.isValid) {
            throw new Error("Condition missing");
        }
    } catch (error) {
        targetCondition = doc.conditions.add({ name: conditionName });
    }

    var paragraphs = doc.stories.everyItem().paragraphs.everyItem().getElements();
    var updatedCount = 0;

    for (var i = 0; i < paragraphs.length; i++) {
        var paragraph = paragraphs[i];
        if (paragraph.appliedParagraphStyle != targetStyle) {
            continue;
        }

        var existingConditions = paragraph.appliedConditions;
        if (!existingConditions || !existingConditions.length) {
            paragraph.appliedConditions = [targetCondition];
            updatedCount++;
            continue;
        }

        var alreadyApplied = false;
        for (var j = 0; j < existingConditions.length; j++) {
            if (existingConditions[j] == targetCondition) {
                alreadyApplied = true;
                break;
            }
        }

        if (!alreadyApplied) {
            var combinedConditions = [];
            for (var k = 0; k < existingConditions.length; k++) {
                combinedConditions.push(existingConditions[k]);
            }
            combinedConditions.push(targetCondition);
            paragraph.appliedConditions = combinedConditions;
            updatedCount++;
        }
    }

    alert("Applied \"" + conditionName + "\" condition to " + updatedCount + " paragraph(s).");
})();

