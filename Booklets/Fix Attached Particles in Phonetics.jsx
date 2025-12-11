/**
 * Fix Attached Particles in Phonetics
 * 
 * Inspects "Verse Phonetics" paragraphs for particles like "tang", "kyi", "gyi", "yi"
 * that are attached to adjacent text. When the corresponding Tibetan marker is found
 * in the preceding "Verse Tibetan" paragraph, offers to insert spaces to separate them.
 */

#target indesign

// Target particles to find
var TARGET_TOKENS = ["tang", "kyi", "gyi", "ki", "gi", "yi"];

// Tibetan markers that correspond to each particle
var TOKEN_TIBETAN_MARKERS = {
    "tang": ["་དང"],
    "kyi": ["་གྱི", "་ཀྱིས", "་གྱིས", "་གིས"],
    "gyi": ["་གྱི", "་ཀྱིས", "་གྱིས", "་གིས"],
    "ki": ["་ཀྱི", "་གི"],
    "gi": ["་ཀྱི", "་གི"],
    "yi": ["་ཡི"]
};

// Characters that can follow the Tibetan marker
var ALLOWED_FOLLOWING_CHARS = "་༔། ";

// Protected Tibetan phrases - skip if these appear in the Tibetan text
var PROTECTED_TIBETAN_PHRASES = ["དབང་དང་", "དང་པོ་", "དང་པོའི་", "དང་པོས་", "ཡི་དམ་"];

// Paragraph styles
var VERSE_TIBETAN_STYLE = "Verse Tibetan";
var VERSE_PHONETICS_STYLE = "Verse Phonetics";

// Main function
function main() {
    if (app.documents.length === 0) {
        alert("Please open a document first.");
        return;
    }
    
    var doc = app.activeDocument;
    
    // Collect all paragraph pairs (Tibetan + Phonetics)
    var pairs = collectParagraphPairs(doc);
    
    if (pairs.length === 0) {
        alert("No Verse Phonetics paragraphs found.");
        return;
    }
    
    // Find all issues
    var allIssues = [];
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var issues = findIssuesInParagraph(pair.phonetics, pair.tibetan);
        for (var j = 0; j < issues.length; j++) {
            issues[j].pairIndex = i;
            issues[j].phoneticsText = pair.phonetics.contents;
            issues[j].tibetanText = pair.tibetan ? pair.tibetan.contents : null;
            issues[j].paragraph = pair.phonetics;
            allIssues.push(issues[j]);
        }
    }
    
    if (allIssues.length === 0) {
        alert("No attached particles found that need fixing.");
        return;
    }
    
    // Process issues interactively
    processIssuesInteractively(allIssues);
}

function collectParagraphPairs(doc) {
    var pairs = [];
    var tibetanBuffer = null;
    
    // Iterate through all stories
    for (var s = 0; s < doc.stories.length; s++) {
        var story = doc.stories[s];
        tibetanBuffer = null;
        
        for (var p = 0; p < story.paragraphs.length; p++) {
            var para = story.paragraphs[p];
            var styleName = para.appliedParagraphStyle.name;
            
            if (styleName === VERSE_TIBETAN_STYLE) {
                tibetanBuffer = para;
            } else if (styleName === VERSE_PHONETICS_STYLE) {
                pairs.push({
                    tibetan: tibetanBuffer,
                    phonetics: para
                });
                // Don't reset tibetanBuffer - same Tibetan may apply to multiple phonetics lines
            }
        }
    }
    
    return pairs;
}

function findIssuesInParagraph(phoneticsPara, tibetanPara) {
    var issues = [];
    var text = phoneticsPara.contents;
    var tibetanText = tibetanPara ? tibetanPara.contents : null;
    var textLower = text.toLowerCase();
    
    var searchPos = 0;
    while (searchPos < text.length) {
        var nextIssue = null;
        var nextPos = text.length;
        
        for (var t = 0; t < TARGET_TOKENS.length; t++) {
            var token = TARGET_TOKENS[t];
            var idx = textLower.indexOf(token, searchPos);
            
            if (idx === -1) continue;
            
            // Skip "yi" if embedded in "kyi" or "gyi"
            if (token === "yi" && isEmbeddedInKyiGyi(text, idx)) {
                continue;
            }
            
            var beforeAttached = idx > 0 && isLetter(text.charAt(idx - 1));
            var afterIndex = idx + token.length;
            var afterAttached = afterIndex < text.length && isLetter(text.charAt(afterIndex));
            
            // Skip if not attached to anything
            if (!beforeAttached && !afterAttached) continue;
            
            // Check Tibetan context
            var tibetanCheck = evaluateTibetanContext(token, tibetanText);
            if (!tibetanCheck.shouldPrompt) continue;
            
            if (idx < nextPos) {
                nextPos = idx;
                var wordBounds = expandWordBoundaries(text, idx, afterIndex);
                nextIssue = {
                    start: idx,
                    end: afterIndex,
                    token: token,
                    actualToken: text.substring(idx, afterIndex),
                    beforeAttached: beforeAttached,
                    afterAttached: afterAttached,
                    wordStart: wordBounds.start,
                    wordEnd: wordBounds.end,
                    tibetanMarker: tibetanCheck.marker
                };
            }
        }
        
        if (nextIssue) {
            issues.push(nextIssue);
            searchPos = nextIssue.end;
        } else {
            break;
        }
    }
    
    return issues;
}

function isEmbeddedInKyiGyi(text, idx) {
    if (idx <= 0) return false;
    var prev = text.charAt(idx - 1).toLowerCase();
    if (prev === "k" || prev === "g") return true;
    if (idx >= 2) {
        var pair = text.substring(idx - 2, idx).toLowerCase();
        if (pair === "kh" || pair === "gh") return true;
    }
    return false;
}

function isLetter(ch) {
    return /[a-zA-Zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿāīūṛṝḷḹēōṃṁḥñṅṇṭḍśṣ]/i.test(ch);
}

function expandWordBoundaries(text, start, end) {
    var left = start;
    while (left > 0 && !isWhitespace(text.charAt(left - 1))) {
        left--;
    }
    var right = end;
    while (right < text.length && !isWhitespace(text.charAt(right))) {
        right++;
    }
    return { start: left, end: right };
}

function isWhitespace(ch) {
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\u00A0";
}

function evaluateTibetanContext(token, tibetanText) {
    var markers = TOKEN_TIBETAN_MARKERS[token];
    if (!markers) return { shouldPrompt: true, marker: null };
    if (!tibetanText) return { shouldPrompt: false, marker: null };
    
    // Check for protected phrases
    for (var i = 0; i < PROTECTED_TIBETAN_PHRASES.length; i++) {
        if (tibetanText.indexOf(PROTECTED_TIBETAN_PHRASES[i]) !== -1) {
            return { shouldPrompt: false, marker: null };
        }
    }
    
    // Look for markers
    for (var m = 0; m < markers.length; m++) {
        var marker = markers[m];
        var idx = tibetanText.indexOf(marker);
        while (idx !== -1) {
            var afterIdx = idx + marker.length;
            var nextChar = afterIdx < tibetanText.length ? tibetanText.charAt(afterIdx) : "";
            if (ALLOWED_FOLLOWING_CHARS.indexOf(nextChar) !== -1) {
                return { shouldPrompt: true, marker: { start: idx, end: afterIdx, text: marker } };
            }
            idx = tibetanText.indexOf(marker, idx + 1);
        }
    }
    
    return { shouldPrompt: false, marker: null };
}

function processIssuesInteractively(allIssues) {
    var currentIndex = 0;
    var appliedCount = 0;
    var applyToAll = false;
    
    while (currentIndex < allIssues.length) {
        var issue = allIssues[currentIndex];
        
        // Re-read current paragraph text (may have changed)
        var currentText = issue.paragraph.contents;
        
        // Recalculate issue position if text changed
        var recalculated = recalculateIssuePosition(issue, currentText);
        if (!recalculated) {
            // Issue no longer exists, skip
            currentIndex++;
            continue;
        }
        
        // If apply to all, just apply without prompting
        if (applyToAll) {
            applyFix(issue);
            appliedCount++;
            currentIndex++;
            continue;
        }
        
        // Select and show the text
        selectAndShowIssue(issue);
        
        // Build preview
        var preview = buildPreview(issue, currentText);
        
        // Show dialog
        var result = showIssueDialog(issue, currentText, currentIndex, allIssues.length, preview);
        
        switch (result) {
            case "apply":
                applyFix(issue);
                appliedCount++;
                currentIndex++;
                break;
            case "skip":
                currentIndex++;
                break;
            case "apply-all":
                applyFix(issue);
                appliedCount++;
                applyToAll = true;
                currentIndex++;
                break;
            case "cancel":
                alert("Fixed " + appliedCount + " issue(s).");
                return;
        }
    }
    
    alert("Done! Fixed " + appliedCount + " issue(s).");
}

function recalculateIssuePosition(issue, currentText) {
    // Try to find the token at or near the expected position
    var textLower = currentText.toLowerCase();
    var token = issue.token;
    
    // Search around the original position
    var searchStart = Math.max(0, issue.start - 10);
    var idx = textLower.indexOf(token, searchStart);
    
    if (idx === -1) return false;
    
    // Verify it's still attached
    var beforeAttached = idx > 0 && isLetter(currentText.charAt(idx - 1));
    var afterIndex = idx + token.length;
    var afterAttached = afterIndex < currentText.length && isLetter(currentText.charAt(afterIndex));
    
    if (!beforeAttached && !afterAttached) return false;
    
    // Update issue
    issue.start = idx;
    issue.end = afterIndex;
    issue.actualToken = currentText.substring(idx, afterIndex);
    issue.beforeAttached = beforeAttached;
    issue.afterAttached = afterAttached;
    var wordBounds = expandWordBoundaries(currentText, idx, afterIndex);
    issue.wordStart = wordBounds.start;
    issue.wordEnd = wordBounds.end;
    
    return true;
}

function selectAndShowIssue(issue) {
    try {
        var para = issue.paragraph;
        var textRange = para.characters.itemByRange(issue.start, issue.end - 1);
        
        // Navigate to the text frame
        if (textRange.parentTextFrames.length > 0) {
            var textFrame = textRange.parentTextFrames[0];
            if (textFrame && textFrame.parentPage) {
                var spread = textFrame.parentPage.parent;
                app.activeWindow.activeSpread = spread;
            }
        }
        
        // Select and show
        app.select(textRange);
        textRange.showText();
    } catch(e) {
        // Silently continue
    }
}

function buildPreview(issue, currentText) {
    var word = currentText.substring(issue.wordStart, issue.wordEnd);
    var tokenInWord = issue.actualToken;
    var tokenStartInWord = issue.start - issue.wordStart;
    var tokenEndInWord = issue.end - issue.wordStart;
    
    var before = word.substring(0, tokenStartInWord);
    var after = word.substring(tokenEndInWord);
    
    var pieces = [];
    pieces.push(before);
    if (issue.beforeAttached) pieces.push(" ");
    pieces.push(tokenInWord);
    if (issue.afterAttached) pieces.push(" ");
    pieces.push(after);
    
    return word + "  →  " + pieces.join("");
}

function showIssueDialog(issue, currentText, currentIndex, totalCount, preview) {
    var dialog = new Window("dialog", "Attached Particle (" + (currentIndex + 1) + "/" + totalCount + ")");
    dialog.orientation = "column";
    dialog.alignChildren = ["fill", "top"];
    
    // Tibetan context
    var tibetanGroup = dialog.add("panel", undefined, "Verse Tibetan");
    tibetanGroup.alignChildren = ["fill", "top"];
    var tibetanText = issue.tibetanText || "(no preceding Verse Tibetan)";
    if (issue.tibetanMarker) {
        // Highlight the marker in the display
        var markerStart = issue.tibetanMarker.start;
        var markerEnd = issue.tibetanMarker.end;
        tibetanText = tibetanText.substring(0, markerStart) + 
                      "【" + tibetanText.substring(markerStart, markerEnd) + "】" + 
                      tibetanText.substring(markerEnd);
    }
    var tibetanLabel = tibetanGroup.add("statictext", undefined, tibetanText, { multiline: true });
    tibetanLabel.preferredSize = [500, 40];
    
    // Phonetics context
    var phoneticsGroup = dialog.add("panel", undefined, "Verse Phonetics");
    phoneticsGroup.alignChildren = ["fill", "top"];
    // Highlight the token
    var displayText = currentText.substring(0, issue.start) + 
                      "【" + currentText.substring(issue.start, issue.end) + "】" + 
                      currentText.substring(issue.end);
    var phoneticsLabel = phoneticsGroup.add("statictext", undefined, displayText, { multiline: true });
    phoneticsLabel.preferredSize = [500, 40];
    
    // Issue details
    var detailsGroup = dialog.add("panel", undefined, "Issue");
    detailsGroup.alignChildren = ["fill", "top"];
    
    var attachmentDesc = [];
    if (issue.beforeAttached) attachmentDesc.push("attached before");
    if (issue.afterAttached) attachmentDesc.push("attached after");
    
    detailsGroup.add("statictext", undefined, "Token: \"" + issue.actualToken + "\" (" + attachmentDesc.join(", ") + ")");
    detailsGroup.add("statictext", undefined, "Suggested fix: " + preview);
    
    // Buttons
    var btnGroup = dialog.add("group");
    btnGroup.alignment = ["center", "top"];
    
    var applyBtn = btnGroup.add("button", undefined, "Apply");
    var skipBtn = btnGroup.add("button", undefined, "Skip");
    var applyAllBtn = btnGroup.add("button", undefined, "Apply to All");
    var cancelBtn = btnGroup.add("button", undefined, "Cancel");
    
    var result = { action: null };
    
    applyBtn.onClick = function() { result.action = "apply"; dialog.close(); };
    skipBtn.onClick = function() { result.action = "skip"; dialog.close(); };
    applyAllBtn.onClick = function() { result.action = "apply-all"; dialog.close(); };
    cancelBtn.onClick = function() { result.action = "cancel"; dialog.close(); };
    
    dialog.show();
    
    return result.action || "cancel";
}

function applyFix(issue) {
    try {
        var para = issue.paragraph;
        var currentText = para.contents;
        
        // Recalculate position
        if (!recalculateIssuePosition(issue, currentText)) {
            return;
        }
        
        var start = issue.start;
        var end = issue.end;
        var newText = currentText;
        
        // Insert space after if needed (do this first to preserve positions)
        if (issue.afterAttached) {
            newText = newText.substring(0, end) + " " + newText.substring(end);
        }
        
        // Insert space before if needed
        if (issue.beforeAttached) {
            newText = newText.substring(0, start) + " " + newText.substring(start);
        }
        
        // Apply the change
        para.contents = newText;
        
    } catch(e) {
        alert("Error applying fix: " + e);
    }
}

// Run the script
main();
