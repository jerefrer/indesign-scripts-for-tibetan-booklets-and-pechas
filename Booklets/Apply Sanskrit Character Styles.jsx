#include "../lib/styles-utils.js"

// Sanskrit syllables to match (case-insensitive)
var SANSKRIT_SYLLABLES = [
    "é",
    "oṁ",
    "āḥ",
    "hūṁ",
    "oṁ āḥ ḥūṁ",
    "bhrūṁ",
    "bhrūṁ bhrūṁ bhrūṁ",
    "bhyoḥ",
    "bhyaḥ",
    "ema",
    "éma",
    "emaho",
    "émaho",
    "kyého",
    "ha",
    "haḥ",
    "ho",
    "hoḥ",
    "bhū",
    "laṁ",
    "hūṁ a",
    "hūṁ bhyoḥ",
    "hūṁ hrīḥ",
    "hūṁ hūṁ hūṁ",
    "hūṁ jaḥ",
    "jaḥ",
    "tāṁ",
    "raṁ",
    "yaṁ",
    "khaṁ",
    "vaṁ",
    "namo",
    "svāhā",
    "svāha",
    "svahā",
    "tuttāra",
    "touttāra",
    "tāre",
    "tāré",
    "traṭ",
    "phaṭ",
    "hara",
    "cakra",
    "caṇḍalī",
    "svasti",
    "oṁ āḥ hūṁ",
    "oṃ svasti!",
    "oṃ svasti",
    "oṁ svasti!",
    "oṁ svasti",
    "citta",
    "kharaṃ",
    "khāhi"
];

// Syllables that only apply to Verse Phonetics (not Translation due to English conflicts)
var PHONETICS_ONLY_SYLLABLES = [
    "a"
];

// Incorrect spellings that should be fixed (lowercase keys)
var FIX_MAPPINGS = {
    "om": "oṁ",
    "ah": "āḥ",
    "âh": "āḥ",
    "āh": "āḥ",
    "âh": "āḥ",
    "aḥ": "āḥ",
    "sva": "svā",
    "hah": "hāḥ",
    "mum laṁ mam pam tam": "muṁ laṁ maṁ paṁ taṁ",
    "mum": "muṁ",
    "mam": "maṁ",
    "pam": "paṁ",
    "taṁ": "tāṁ",
    "tām": "tāṁ",
    "hung": "hūṁ",
    "houng": "hūṁ",
    "hoûng": "hūṁ",
    "hūm": "hūṁ",
    "hûm": "hūṁ",
    "huṁ": "hūṁ",
    "hum": "hūṁ",
    "huṃ": "hūṁ",
    "hūṃ": "hūṁ",
    "hûṃ": "hūṁ",
    "e": "é",
    "ê": "é",
    "soha": "svāhā",
    "sôha": "svāhā",
    "sôhâ": "svāhā",
    "sohâ": "svāhā",
    "svaha": "svāhā",
    "hrih": "hrīḥ",
    "hrîh": "hrīḥ",
    "hri": "hrīḥ",
    "hrî": "hrīḥ",
    "dhrum": "bhrūṁ",
    "bhyo": "bhyoḥ",
    "bhyoh": "bhyoḥ",
    "bhya": "bhyaḥ",
    "bhyah": "bhyaḥ",
    "phat": "phaṭ",
    "phet": "phaṭ",
    "phêt": "phaṭ",
    "trat": "traṭ",
    "touttara": "tuttāra",
    "touttāra": "tuttāra",
    "kharam": "kharaṃ",
    "kharaṁ": "kharaṃ",
    "khahi": "khāhi"
};

// Sanskrit diacritics pattern - characters that indicate Sanskrit
var SANSKRIT_DIACRITICS = "āīūṛṝḷḹēōṃṁḥñṅṇṭḍśṣ";
var SANSKRIT_DIACRITICS_UPPER = "ĀĪŪṚṜḶḸĒŌṂṀḤÑṄṆṬḌŚṢ";

// Circumflex vowels that should be converted to macron (these also trigger matching)
var CIRCUMFLEX_VOWELS = "âîûêôÂÎÛÊÔ";

// Paragraph styles to search in
var TARGET_PARAGRAPH_STYLES = [
    "Verse Translation",
    "Verse Phonetics"
];

// Character styles to apply
var STYLE_BEGINNING = "Sanskrit at the beginning";
var STYLE_IN_VERSE = "Sanskrit in Verse";

function main() {
    if (app.documents.length === 0) {
        alert("Please open a document first.");
        return;
    }

    var doc = app.activeDocument;
    
    // Verify character styles exist
    var styleBeginning = findStyleByPath(STYLE_BEGINNING, 'character');
    var styleInVerse = findStyleByPath(STYLE_IN_VERSE, 'character');
    
    if (!styleBeginning) {
        alert("Character style '" + STYLE_BEGINNING + "' not found.");
        return;
    }
    if (!styleInVerse) {
        alert("Character style '" + STYLE_IN_VERSE + "' not found.");
        return;
    }
    
    // Ask user what to search for
    var optionsDialog = new Window("dialog", "Sanskrit Search Options");
    optionsDialog.orientation = "column";
    optionsDialog.alignChildren = ["fill", "top"];
    
    optionsDialog.add("statictext", undefined, "What would you like to search for?");
    
    var syllablesOnly = optionsDialog.add("radiobutton", undefined, "Known Sanskrit syllables only");
    var includeDiacritics = optionsDialog.add("radiobutton", undefined, "Syllables + any word with Sanskrit diacritics");
    syllablesOnly.value = true;
    
    var btnGroup = optionsDialog.add("group");
    btnGroup.add("button", undefined, "OK", { name: "ok" });
    btnGroup.add("button", undefined, "Cancel", { name: "cancel" });
    
    if (optionsDialog.show() !== 1) {
        return;
    }
    
    var searchDiacritics = includeDiacritics.value;

    app.doScript(function() {
        findAndStyleSanskrit(doc, styleBeginning, styleInVerse, searchDiacritics);
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Apply Sanskrit Styles");
}

function findAndStyleSanskrit(doc, styleBeginning, styleInVerse, searchDiacritics) {
    var matches = [];
    
    // Show progress bar immediately for collecting paragraphs
    var progressBar = new Window("palette", "Searching for Sanskrit...");
    progressBar.statusText = progressBar.add("statictext", undefined, "Collecting paragraphs...");
    progressBar.statusText.preferredSize.width = 300;
    progressBar.pbar = progressBar.add("progressbar", undefined, 0, 100);
    progressBar.pbar.preferredSize.width = 300;
    progressBar.show();
    progressBar.update();
    
    var paragraphs = getParagraphsToProcess(doc, progressBar);
    
    if (!paragraphs || paragraphs.length === 0) {
        progressBar.close();
        alert("No paragraphs found to process.");
        return;
    }

    var totalParas = paragraphs.length;
    progressBar.pbar.maxvalue = totalParas;
    progressBar.pbar.value = 0;
    progressBar.statusText.text = "Scanning paragraphs...";
    progressBar.update();

    // Find all Sanskrit matches
    var targetParaCount = 0;
    for (var i = 0; i < paragraphs.length; i++) {
        var para = paragraphs[i];
        
        // Update progress every 20 paragraphs
        if (i % 20 === 0) {
            progressBar.pbar.value = i;
            progressBar.statusText.text = "Scanning paragraph " + (i + 1) + " of " + totalParas + "...";
            progressBar.update();
        }
        
        // Check if paragraph has one of the target styles
        var styleType = getTargetStyleType(para);
        if (!styleType) {
            continue;
        }
        
        targetParaCount++;
        var content = para.contents;
        if (!content || content.length === 0) continue;
        
        // Find Sanskrit syllables in this paragraph
        var isPhonetics = (styleType === "phonetics");
        var paraMatches = findSanskritInParagraph(para, content, isPhonetics, searchDiacritics, styleBeginning, styleInVerse);
        for (var m = 0; m < paraMatches.length; m++) {
            matches.push(paraMatches[m]);
        }
    }
    
    progressBar.close();

    if (matches.length === 0) {
        alert("No Sanskrit syllables found.\n(Scanned " + targetParaCount + " matching paragraphs out of " + totalParas + " total)");
        return;
    }

    // Process matches interactively
    processMatchesInteractively(matches, styleBeginning, styleInVerse);
}

function getParagraphsToProcess(doc, progressBar) {
    var selection = doc.selection;
    
    // Check if there's a valid text selection (not just cursor)
    if (selection && selection.length > 0 && selection[0]) {
        var sel = selection[0];
        
        // Check if it's an actual text selection with multiple paragraphs
        // (not just an insertion point or single paragraph cursor)
        if (sel.hasOwnProperty('paragraphs') && sel.paragraphs.length > 1) {
            // Real multi-paragraph selection - use only selected paragraphs
            return sel.paragraphs;
        }
        
        // Check if there's actual selected text (not just insertion point)
        if (sel.hasOwnProperty('contents') && sel.contents && sel.contents.length > 0) {
            // There's selected text - use just that selection's paragraphs
            if (sel.hasOwnProperty('paragraphs') && sel.paragraphs.length > 0) {
                return sel.paragraphs;
            }
        }
    }
    
    // No meaningful selection - process entire document
    var allParagraphs = [];
    var totalStories = doc.stories.length;
    for (var i = 0; i < totalStories; i++) {
        var story = doc.stories[i];
        if (progressBar && i % 5 === 0) {
            progressBar.statusText.text = "Collecting paragraphs from story " + (i + 1) + " of " + totalStories + "...";
            progressBar.update();
        }
        for (var j = 0; j < story.paragraphs.length; j++) {
            allParagraphs.push(story.paragraphs[j]);
        }
    }
    return allParagraphs;
}

function getTargetStyleType(paragraph) {
    try {
        var stylePath = getStylePath(paragraph.appliedParagraphStyle);
        var styleName = paragraph.appliedParagraphStyle.name;
        
        // Check for Verse Phonetics
        if (stylePath === "Verse Phonetics" || 
            styleName === "Verse Phonetics" ||
            stylePath.indexOf("/Verse Phonetics") !== -1 ||
            styleName.indexOf("Verse Phonetics") !== -1) {
            return "phonetics";
        }
        
        // Check for Verse Translation
        if (stylePath === "Verse Translation" || 
            styleName === "Verse Translation" ||
            stylePath.indexOf("/Verse Translation") !== -1 ||
            styleName.indexOf("Verse Translation") !== -1) {
            return "translation";
        }
        
        return null;
    } catch(e) {
        return null;
    }
}

function findSanskritInParagraph(para, content, isPhonetics, searchDiacritics, styleBeginning, styleInVerse) {
    var matches = [];
    var foundPositions = {}; // Track positions to avoid duplicates
    
    // Build syllable list - include phonetics-only syllables if in Verse Phonetics
    var syllablesToCheck = SANSKRIT_SYLLABLES.slice();
    if (isPhonetics) {
        for (var pi = 0; pi < PHONETICS_ONLY_SYLLABLES.length; pi++) {
            syllablesToCheck.push(PHONETICS_ONLY_SYLLABLES[pi]);
        }
    }
    
    // Also add fixable syllables to the search (but respect phonetics-only rules)
    for (var fixKey in FIX_MAPPINGS) {
        // Check if this fixable syllable is phonetics-only
        var isPhoneticOnly = false;
        for (var poi = 0; poi < PHONETICS_ONLY_SYLLABLES.length; poi++) {
            if (PHONETICS_ONLY_SYLLABLES[poi].toLowerCase() === fixKey.toLowerCase()) {
                isPhoneticOnly = true;
                break;
            }
        }
        // Only add if it's not phonetics-only, or if we're in phonetics
        if (!isPhoneticOnly || isPhonetics) {
            syllablesToCheck.push(fixKey);
        }
    }
    
    // First, find exact matches from the syllable list
    var contentLower = content.toLowerCase();
    for (var i = 0; i < syllablesToCheck.length; i++) {
        var syllable = syllablesToCheck[i];
        var syllableLower = syllable.toLowerCase();
        
        var pos = 0;
        while (pos < content.length) {
            var idx = contentLower.indexOf(syllableLower, pos);
            if (idx === -1) break;
            
            // Check if it's a standalone word (space/start before and space/end/punctuation after)
            var isStandalone = isStandaloneWord(content, idx, syllable.length);
            
            if (isStandalone) {
                // Check if followed by "!" - include it in the match
                var matchLength = syllable.length;
                var endIdx = idx + syllable.length;
                if (endIdx < content.length && content.charAt(endIdx) === '!') {
                    matchLength++;
                }
                
                var key = idx + "_" + matchLength;
                if (!foundPositions[key]) {
                    // Check if already has a Sanskrit character style applied
                    if (!hasCharacterStyleApplied(para, idx, matchLength, styleBeginning, styleInVerse)) {
                        var isAtBeginning = isAtLineBeginning(content, idx);
                        var foundText = content.substr(idx, matchLength);
                        
                        // Check if this needs fixing (use base text without "!" for lookup)
                        var baseText = foundText.replace(/!$/, '');
                        var hasExclamation = foundText.charAt(foundText.length - 1) === '!';
                        var fixTo = null;
                        
                        // Check FIX_MAPPINGS first
                        fixTo = FIX_MAPPINGS[baseText.toLowerCase()];
                        if (fixTo) {
                            // If ALL CAPS, keep as lowercase (capitalize only if at beginning of line)
                            if (isAllCaps(baseText)) {
                                if (isAtBeginning) {
                                    fixTo = fixTo.charAt(0).toUpperCase() + fixTo.slice(1);
                                }
                                // else keep fixTo as lowercase (which it already is from FIX_MAPPINGS)
                            } else if (baseText.charAt(0) === baseText.charAt(0).toUpperCase() && baseText.charAt(0) !== baseText.charAt(0).toLowerCase()) {
                                // First letter is uppercase but not ALL CAPS - preserve initial cap only
                                fixTo = fixTo.charAt(0).toUpperCase() + fixTo.slice(1);
                            }
                            // else keep fixTo as lowercase
                        }
                        
                        // Check for circumflex vowels that should be macron (automatic fix)
                        if (!fixTo && hasCircumflexVowel(baseText)) {
                            fixTo = replaceCaretWithMacron(baseText);
                            // Also convert to lowercase if ALL CAPS
                            if (isAllCaps(baseText)) {
                                fixTo = fixTo.toLowerCase();
                                if (isAtBeginning) {
                                    fixTo = fixTo.charAt(0).toUpperCase() + fixTo.slice(1);
                                }
                            }
                        }
                        
                        // Check for ALL CAPS (automatic fix) - use the matched syllable as the correct form
                        if (!fixTo && isAllCaps(baseText)) {
                            // Use the syllable from the list as the correct lowercase form
                            fixTo = syllable.toLowerCase();
                            if (isAtBeginning) {
                                fixTo = fixTo.charAt(0).toUpperCase() + fixTo.slice(1);
                            }
                        }
                        
                        // Append "!" if original had it
                        if (fixTo && hasExclamation) {
                            fixTo = fixTo + '!';
                        }
                        
                        matches.push({
                            paragraph: para,
                            startIndex: idx,
                            length: matchLength,
                            text: foundText,
                            isAtBeginning: isAtBeginning,
                            fixTo: fixTo || null
                        });
                    }
                    foundPositions[key] = true;
                    // Mark all character positions as covered
                    for (var p = idx; p < idx + matchLength; p++) {
                        foundPositions["pos_" + p] = true;
                    }
                }
            }
            pos = idx + 1;
        }
    }
    
    // Then, find any words containing Sanskrit diacritics (if enabled)
    if (searchDiacritics) {
        var words = findWordsWithDiacritics(content);
        for (var w = 0; w < words.length; w++) {
            var word = words[w];
            var wordKey = word.startIndex + "_" + word.length;
            if (!foundPositions[wordKey]) {
                // Check if any character position in this word is already covered
                var overlaps = false;
                for (var checkPos = word.startIndex; checkPos < word.startIndex + word.length; checkPos++) {
                    if (foundPositions["pos_" + checkPos]) {
                        overlaps = true;
                        break;
                    }
                }
                
                if (!overlaps) {
                    // Check if already has a Sanskrit character style applied
                    if (!hasCharacterStyleApplied(para, word.startIndex, word.length, styleBeginning, styleInVerse)) {
                        var isAtBeginning = isAtLineBeginning(content, word.startIndex);
                        
                        // Check if word contains circumflex vowels that need fixing
                        var fixTo = null;
                        if (hasCircumflexVowel(word.text)) {
                            fixTo = replaceCaretWithMacron(word.text);
                            if (isAtBeginning) {
                                fixTo = fixTo.charAt(0).toUpperCase() + fixTo.slice(1);
                            }
                        }
                        // Also check for ALL CAPS
                        if (!fixTo && isAllCaps(word.text)) {
                            fixTo = word.text.toLowerCase();
                            if (isAtBeginning) {
                                fixTo = fixTo.charAt(0).toUpperCase() + fixTo.slice(1);
                            }
                        }
                        
                        matches.push({
                            paragraph: para,
                            startIndex: word.startIndex,
                            length: word.length,
                            text: word.text,
                            isAtBeginning: isAtBeginning,
                            fixTo: fixTo
                        });
                    }
                    foundPositions[wordKey] = true;
                }
            }
        }
    }
    
    // Sort matches by position
    matches.sort(function(a, b) {
        return a.startIndex - b.startIndex;
    });
    
    return matches;
}

function hasCharacterStyleApplied(para, startIdx, len, styleBeginning, styleInVerse) {
    try {
        var textRange = para.characters.itemByRange(startIdx, startIdx + len - 1);
        var appliedStyle = textRange.appliedCharacterStyle;
        
        // Check if it's one of the Sanskrit styles
        if (appliedStyle === styleBeginning || appliedStyle === styleInVerse) {
            return true;
        }
        
        // Also check by name in case of object comparison issues
        if (appliedStyle && appliedStyle.name) {
            if (appliedStyle.name === STYLE_BEGINNING || appliedStyle.name === STYLE_IN_VERSE) {
                return true;
            }
        }
        
        return false;
    } catch(e) {
        return false;
    }
}

function isStandaloneWord(content, idx, len) {
    // Check character before
    if (idx > 0) {
        var charBefore = content.charAt(idx - 1);
        if (!isWordBoundary(charBefore)) {
            return false;
        }
    }
    
    // Check character after
    var endIdx = idx + len;
    if (endIdx < content.length) {
        var charAfter = content.charAt(endIdx);
        if (!isWordBoundary(charAfter)) {
            return false;
        }
    }
    
    return true;
}

function replaceCaretWithMacron(text) {
    // Replace circumflex vowels with macron vowels
    var result = text;
    result = result.replace(/â/g, 'ā');
    result = result.replace(/Â/g, 'Ā');
    result = result.replace(/î/g, 'ī');
    result = result.replace(/Î/g, 'Ī');
    result = result.replace(/û/g, 'ū');
    result = result.replace(/Û/g, 'Ū');
    result = result.replace(/ê/g, 'ē');
    result = result.replace(/Ê/g, 'Ē');
    result = result.replace(/ô/g, 'ō');
    result = result.replace(/Ô/g, 'Ō');
    return result;
}

function hasCircumflexVowel(text) {
    for (var i = 0; i < CIRCUMFLEX_VOWELS.length; i++) {
        if (text.indexOf(CIRCUMFLEX_VOWELS.charAt(i)) !== -1) {
            return true;
        }
    }
    return false;
}

function isAllCaps(text) {
    // Check if text is all uppercase (must have at least one letter, no lowercase)
    if (!text || text.length === 0) return false;
    
    var hasUppercase = false;
    var textUpper = text.toUpperCase();
    var textLower = text.toLowerCase();
    
    // If text equals its uppercase version and differs from lowercase, it's all caps
    // But we also need to check it has at least one letter
    for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        var chUpper = textUpper.charAt(i);
        var chLower = textLower.charAt(i);
        
        // If this character has different upper/lower forms, it's a letter
        if (chUpper !== chLower) {
            // It's a letter - check if it's uppercase
            if (ch === chLower) {
                return false; // Found a lowercase letter
            }
            hasUppercase = true;
        }
    }
    return hasUppercase;
}

function isWordBoundary(ch) {
    // Space, punctuation, or common separators (including various quote styles)
    // Curly quotes: ' (\u2018), ' (\u2019), " (\u201C), " (\u201D)
    // Guillemets: « (\u00AB), » (\u00BB), ‹ (\u2039), › (\u203A)
    // Non-breaking space: \u00A0
    return " \t\n\r,.;:!?()[]{}\"'-/\u2018\u2019\u201C\u201D\u00AB\u00BB\u2039\u203A\u2013\u2014\u00A0".indexOf(ch) !== -1;
}

function preserveCase(original, replacement) {
    // Check if original starts with uppercase
    var firstChar = original.charAt(0);
    var isUpperCase = firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();
    
    if (isUpperCase) {
        // Capitalize first letter of replacement
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
}

function isAtLineBeginning(content, idx) {
    // At the very start of the paragraph
    if (idx === 0) return true;
    
    // Check if preceded only by whitespace from start or after a newline
    for (var i = idx - 1; i >= 0; i--) {
        var ch = content.charAt(i);
        if (ch === '\n' || ch === '\r') {
            return true;
        }
        if (ch !== ' ' && ch !== '\t') {
            return false;
        }
    }
    
    // If we got here, only whitespace before - consider it beginning
    return true;
}

function findWordsWithDiacritics(content) {
    var words = [];
    var allDiacritics = SANSKRIT_DIACRITICS + SANSKRIT_DIACRITICS_UPPER + CIRCUMFLEX_VOWELS;
    
    var wordStart = -1;
    var currentWord = "";
    
    for (var i = 0; i <= content.length; i++) {
        var ch = i < content.length ? content.charAt(i) : " ";
        var isBoundary = isWordBoundary(ch);
        
        if (isBoundary) {
            if (wordStart !== -1 && currentWord.length > 0) {
                // Check if word contains any Sanskrit diacritics
                var hasDiacritic = false;
                for (var d = 0; d < allDiacritics.length; d++) {
                    if (currentWord.indexOf(allDiacritics.charAt(d)) !== -1) {
                        hasDiacritic = true;
                        break;
                    }
                }
                
                if (hasDiacritic) {
                    words.push({
                        startIndex: wordStart,
                        length: currentWord.length,
                        text: currentWord
                    });
                }
            }
            wordStart = -1;
            currentWord = "";
        } else {
            if (wordStart === -1) {
                wordStart = i;
            }
            currentWord += ch;
        }
    }
    
    return words;
}

function processMatchesInteractively(matches, styleBeginning, styleInVerse) {
    var currentIndex = 0;
    var appliedCount = 0;
    var skippedCount = 0;
    var undoStack = []; // Stack of undo actions
    
    while (currentIndex >= 0 && currentIndex < matches.length) {
        var match = matches[currentIndex];
        
        // Select and show the match
        selectMatch(match);
        
        // Show dialog for user choice
        var suggestedStyle = match.isAtBeginning ? "Sanskrit at the beginning" : "Sanskrit in Verse";
        
        var dialog = new Window("dialog", "Sanskrit Found (" + (currentIndex + 1) + "/" + matches.length + ")");
        dialog.orientation = "column";
        dialog.alignChildren = ["fill", "top"];
        
        // Show the found text
        var textGroup = dialog.add("group");
        textGroup.add("statictext", undefined, "Found:");
        var textDisplay = textGroup.add("statictext", undefined, '"' + match.text + '"');
        textDisplay.characters = 40;
        
        // Show position info
        var posGroup = dialog.add("group");
        posGroup.add("statictext", undefined, "Position: " + (match.isAtBeginning ? "Beginning of line" : "Within line"));
        
        // Show suggested style
        var suggestGroup = dialog.add("group");
        suggestGroup.add("statictext", undefined, "Suggested style: " + suggestedStyle);
        
        // Show fix info if applicable
        if (match.fixTo) {
            var fixGroup = dialog.add("group");
            fixGroup.add("statictext", undefined, "Can fix to: \"" + match.fixTo + "\"");
        }
        
        dialog.add("panel", undefined, "").preferredSize.height = 1;
        
        // Line 1: Apply buttons
        var btnGroup1 = dialog.add("group");
        var applyBeginningBtn = btnGroup1.add("button", undefined, "Apply 'Beginning'");
        var applyVerseBtn = btnGroup1.add("button", undefined, "Apply 'In Verse'");
        
        // Line 2: Fix and Apply buttons (only if fixable)
        var btnGroup2 = dialog.add("group");
        var fixBeginningBtn = btnGroup2.add("button", undefined, "Fix & Apply 'Beginning'");
        var fixVerseBtn = btnGroup2.add("button", undefined, "Fix & Apply 'In Verse'");
        fixBeginningBtn.enabled = (match.fixTo !== null);
        fixVerseBtn.enabled = (match.fixTo !== null);
        
        // Line 3: Skip
        var btnGroup3 = dialog.add("group");
        var skipBtn = btnGroup3.add("button", undefined, "Skip");
        
        // Line 4: Previous / Next / Undo
        var btnGroup4 = dialog.add("group");
        var prevBtn = btnGroup4.add("button", undefined, "Previous");
        var nextBtn = btnGroup4.add("button", undefined, "Next");
        var undoBtn = btnGroup4.add("button", undefined, "Undo");
        
        // Disable prev/next if at boundaries, undo if stack is empty
        prevBtn.enabled = (currentIndex > 0);
        nextBtn.enabled = (currentIndex < matches.length - 1);
        undoBtn.enabled = (undoStack.length > 0);
        
        // Line 5: Cancel
        var btnGroup5 = dialog.add("group");
        var cancelBtn = btnGroup5.add("button", undefined, "Cancel");
        
        var result = { action: null };
        
        applyBeginningBtn.onClick = function() { result.action = 'beginning'; dialog.close(); };
        applyVerseBtn.onClick = function() { result.action = 'verse'; dialog.close(); };
        fixBeginningBtn.onClick = function() { result.action = 'fix-beginning'; dialog.close(); };
        fixVerseBtn.onClick = function() { result.action = 'fix-verse'; dialog.close(); };
        skipBtn.onClick = function() { result.action = 'skip'; dialog.close(); };
        prevBtn.onClick = function() { result.action = 'prev'; dialog.close(); };
        nextBtn.onClick = function() { result.action = 'next'; dialog.close(); };
        undoBtn.onClick = function() { result.action = 'undo'; dialog.close(); };
        cancelBtn.onClick = function() { result.action = 'cancel'; dialog.close(); };
        
        dialog.show();
        
        switch (result.action) {
            case 'beginning':
                undoStack.push(applyStyleToMatch(match, styleBeginning, currentIndex));
                appliedCount++;
                currentIndex++;
                break;
            case 'verse':
                undoStack.push(applyStyleToMatch(match, styleInVerse, currentIndex));
                appliedCount++;
                currentIndex++;
                break;
            case 'fix-beginning':
                undoStack.push(fixAndApplyStyleToMatch(match, styleBeginning, matches, currentIndex));
                appliedCount++;
                currentIndex++;
                break;
            case 'fix-verse':
                undoStack.push(fixAndApplyStyleToMatch(match, styleInVerse, matches, currentIndex));
                appliedCount++;
                currentIndex++;
                break;
            case 'skip':
                skippedCount++;
                currentIndex++;
                break;
            case 'prev':
                currentIndex--;
                break;
            case 'next':
                currentIndex++;
                break;
            case 'undo':
                if (undoStack.length > 0) {
                    var undoAction = undoStack.pop();
                    performUndo(undoAction, matches);
                    appliedCount--;
                    currentIndex = undoAction.matchIndex;
                }
                break;
            case 'cancel':
            default:
                alert("Cancelled.\nApplied: " + appliedCount + "\nSkipped: " + skippedCount);
                return;
        }
    }
    
    alert("Completed!\nApplied: " + appliedCount + "\nSkipped: " + skippedCount);
}

function selectMatch(match) {
    try {
        var para = match.paragraph;
        var textRange = para.characters.itemByRange(match.startIndex, match.startIndex + match.length - 1);
        
        // Get the text frame containing the paragraph
        if (para.parentTextFrames.length > 0) {
            var textFrame = para.parentTextFrames[0];
            
            if (textFrame && textFrame.parentPage) {
                var spread = textFrame.parentPage.parent;
                app.activeWindow.activeSpread = spread;
            }
        }
        
        // Select and show the text
        app.select(textRange);
        textRange.showText();
    } catch(e) {
        // Silently continue if selection fails
    }
}

function applyStyleToMatch(match, style, matchIndex) {
    try {
        var para = match.paragraph;
        var textRange = para.characters.itemByRange(match.startIndex, match.startIndex + match.length - 1);
        
        // Store previous style name for undo (use name to avoid reference issues)
        var prevStyle = textRange.appliedCharacterStyle;
        var previousStyleName = prevStyle ? prevStyle.name : null;
        
        textRange.appliedCharacterStyle = style;
        
        // Return undo information
        return {
            type: 'apply',
            matchIndex: matchIndex,
            paragraph: para,
            startIndex: match.startIndex,
            length: match.length,
            previousStyleName: previousStyleName
        };
    } catch(e) {
        alert("Error applying style: " + e);
        return null;
    }
}

function fixAndApplyStyleToMatch(match, style, allMatches, currentIndex) {
    try {
        var para = match.paragraph;
        var textRange = para.characters.itemByRange(match.startIndex, match.startIndex + match.length - 1);
        
        // Store previous style name and text for undo (use name to avoid reference issues)
        var prevStyle = textRange.appliedCharacterStyle;
        var previousStyleName = prevStyle ? prevStyle.name : null;
        var originalText = match.text;
        var originalLength = match.length;
        
        // Replace the text with the corrected version
        if (match.fixTo) {
            var oldLength = match.length;
            var newLength = match.fixTo.length;
            var lengthDiff = newLength - oldLength;
            
            // Use fixTo directly - case has already been determined during matching
            var fixedText = match.fixTo;
            
            textRange.contents = fixedText;
            
            // Update the match's length to reflect the new text
            match.length = newLength;
            match.text = match.fixTo;
            
            // Adjust startIndex for all subsequent matches in the same paragraph
            if (lengthDiff !== 0) {
                for (var i = currentIndex + 1; i < allMatches.length; i++) {
                    if (allMatches[i].paragraph === para && allMatches[i].startIndex > match.startIndex) {
                        allMatches[i].startIndex += lengthDiff;
                    }
                }
            }
            
            // Re-select the range with the new length
            textRange = para.characters.itemByRange(match.startIndex, match.startIndex + newLength - 1);
        }
        
        // Apply the character style
        textRange.appliedCharacterStyle = style;
        
        // Return undo information
        return {
            type: 'fix',
            matchIndex: currentIndex,
            paragraph: para,
            startIndex: match.startIndex,
            newLength: match.fixTo ? match.fixTo.length : match.length,
            originalText: originalText,
            originalLength: originalLength,
            previousStyleName: previousStyleName,
            lengthDiff: match.fixTo ? (match.fixTo.length - originalLength) : 0
        };
    } catch(e) {
        alert("Error fixing and applying style: " + e);
        return null;
    }
}

function performUndo(undoAction, allMatches) {
    if (!undoAction) return;
    
    try {
        var para = undoAction.paragraph;
        var doc = app.activeDocument;
        
        // Get the style to restore (by name, or [None] if no previous style)
        var styleToRestore;
        if (undoAction.previousStyleName && undoAction.previousStyleName !== "[None]") {
            styleToRestore = doc.characterStyles.itemByName(undoAction.previousStyleName);
        } else {
            styleToRestore = doc.characterStyles.itemByName("[None]");
        }
        
        if (undoAction.type === 'apply') {
            // Just restore the previous style
            var textRange = para.characters.itemByRange(undoAction.startIndex, undoAction.startIndex + undoAction.length - 1);
            textRange.appliedCharacterStyle = styleToRestore;
        } else if (undoAction.type === 'fix') {
            // Restore original text and style
            var textRange = para.characters.itemByRange(undoAction.startIndex, undoAction.startIndex + undoAction.newLength - 1);
            textRange.contents = undoAction.originalText;
            
            // Re-select with original length and restore style
            textRange = para.characters.itemByRange(undoAction.startIndex, undoAction.startIndex + undoAction.originalLength - 1);
            textRange.appliedCharacterStyle = styleToRestore;
            
            // Update the match object
            var match = allMatches[undoAction.matchIndex];
            match.length = undoAction.originalLength;
            match.text = undoAction.originalText;
            
            // Reverse the startIndex adjustments for subsequent matches
            if (undoAction.lengthDiff !== 0) {
                for (var i = undoAction.matchIndex + 1; i < allMatches.length; i++) {
                    if (allMatches[i].paragraph === para && allMatches[i].startIndex > undoAction.startIndex) {
                        allMatches[i].startIndex -= undoAction.lengthDiff;
                    }
                }
            }
        }
    } catch(e) {
        alert("Error performing undo: " + e);
    }
}

main();
