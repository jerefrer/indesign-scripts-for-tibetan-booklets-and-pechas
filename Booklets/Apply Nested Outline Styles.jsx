#include "../lib/styles-utils.js"

// Source styles to check
var SOURCE_STYLES = [
    "Heading 2 Translation",
    "Heading 3 Translation",
    "Heading 3 Translation in TOC",
    "Heading 4 Translation in TOC",
    "Heading 5 Translation in TOC",
    "Heading 6 Translation in TOC",
    "Heading 7 Translation in TOC"
];

// Outline level constants
var LEVEL_ROMAN_UPPER = 3;  // I. II. III.
var LEVEL_NUMBER_DOT = 4;   // 1. 2. 3.
var LEVEL_LETTER_UPPER = 5; // A. B. C.
var LEVEL_ROMAN_LOWER = 6;  // i. ii. iii.
var LEVEL_NUMBER_PAREN = 7; // 1) 2) 3)
var LEVEL_LETTER_LOWER = 7; // a. b. c. -> rename to 1) 2) 3)
var LEVEL_ROMAN_LOWER_PAREN = 8; // i) ii) iii)

var LEVEL_STYLES = {
    3: "Heading 3 Translation in TOC",
    4: "Heading 4 Translation in TOC",
    5: "Heading 5 Translation in TOC",
    6: "Heading 6 Translation in TOC",
    7: "Heading 7 Translation in TOC",
    8: "Heading 8 Translation in TOC"
};

// Valid Roman numeral patterns (I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, etc.)
var ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
    'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
    'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC', 'C'];
var ROMAN_NUMERALS_LOWER = [];
for (var r = 0; r < ROMAN_NUMERALS.length; r++) {
    ROMAN_NUMERALS_LOWER.push(ROMAN_NUMERALS[r].toLowerCase());
}

// Letters A-Z and a-z
var LETTERS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
var LETTERS_LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');

function main() {
    var doc = app.activeDocument;
    app.doScript(function() {
        applyNestedOutlineStyles(doc);
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT);
}

function ensureStyleExists(doc, styleName, baseStyleName) {
    var style = findStyleByPath(styleName, 'paragraph');
    if (style) {
        return style;
    }
    
    // Try to find the base style to copy properties from
    var baseStyle = findStyleByPath(baseStyleName, 'paragraph');
    
    // Create the new style
    var newStyle = doc.paragraphStyles.add({ name: styleName });
    
    if (baseStyle) {
        // Copy properties from base style
        newStyle.basedOn = baseStyle;
    }
    
    return newStyle;
}

// Parse the prefix from content and return {type, value, suffix} or null
function parsePrefix(content) {
    // Match: prefix (letters/numbers/roman) + separator (. or )) + optional space
    var match = content.match(/^([A-Za-z]+|\d+)([.\)])\s*/);
    if (!match) return null;
    
    return {
        full: match[0],
        value: match[1],
        separator: match[2]
    };
}

// Determine outline level based on prefix and context
function determineLevel(prefix, lastLevelByType) {
    var val = prefix.value;
    var sep = prefix.separator;
    
    // Numbers with parenthesis: always level 7
    if (/^\d+$/.test(val) && sep === ')') {
        return LEVEL_NUMBER_PAREN;
    }
    
    // Numbers with dot: always level 4
    if (/^\d+$/.test(val) && sep === '.') {
        return LEVEL_NUMBER_DOT;
    }
    
    // Lowercase letters
    if (/^[a-z]+$/.test(val)) {
        // Check if it's a valid lowercase Roman numeral
        var isRomanLower = false;
        for (var i = 0; i < ROMAN_NUMERALS_LOWER.length; i++) {
            if (ROMAN_NUMERALS_LOWER[i] === val) {
                isRomanLower = true;
                break;
            }
        }
        
        // Check if it's a single lowercase letter a-z
        var isLetterLower = false;
        for (var l = 0; l < LETTERS_LOWER.length; l++) {
            if (LETTERS_LOWER[l] === val) {
                isLetterLower = true;
                break;
            }
        }
        
        if (sep === ')') {
            // Check if it's a letter like a) b) c) or Roman like i) ii) iii)
            if (isLetterLower && !isRomanLower) {
                // a) b) c) format - level 7, to be renamed to 1) 2) 3)
                return LEVEL_LETTER_LOWER;
            }
            // i) ii) iii) format - level 8
            return LEVEL_ROMAN_LOWER_PAREN;
        }
        
        // If it's a lowercase letter like a. b. c. (not a Roman numeral), treat as level 7
        if (isLetterLower && !isRomanLower) {
            return LEVEL_LETTER_LOWER;
        }
        
        if (isRomanLower) {
            // Could be Roman numeral - it's level 6
            return LEVEL_ROMAN_LOWER;
        }
        
        // Not a recognized pattern for lowercase
        return null;
    }
    
    // Uppercase letters
    if (/^[A-Z]+$/.test(val) && sep === '.') {
        // Check if it's a valid uppercase Roman numeral
        var isRomanUpper = false;
        for (var j = 0; j < ROMAN_NUMERALS.length; j++) {
            if (ROMAN_NUMERALS[j] === val) {
                isRomanUpper = true;
                break;
            }
        }
        
        // Check if it's a single letter A-Z
        var isLetter = false;
        for (var k = 0; k < LETTERS_UPPER.length; k++) {
            if (LETTERS_UPPER[k] === val) {
                isLetter = true;
                break;
            }
        }
        
        // Ambiguous case: could be Roman (I, V, X, L, C, D, M) or Letter (A, B, C, D, ...)
        if (isRomanUpper && isLetter) {
            // Use context: if we've seen level 4 (1. 2. 3.) more recently than level 3,
            // then this is likely a letter (level 5)
            // If we've seen level 3 more recently or nothing, it's Roman (level 3)
            
            // Check what the last assigned level was
            var lastRoman = lastLevelByType[LEVEL_ROMAN_UPPER] || 0;
            var lastNumber = lastLevelByType[LEVEL_NUMBER_DOT] || 0;
            
            if (lastNumber > lastRoman) {
                // We saw 1. 2. 3. after the last I. II. III., so this is likely A. B. C.
                return LEVEL_LETTER_UPPER;
            } else {
                // Default to Roman numeral
                return LEVEL_ROMAN_UPPER;
            }
        }
        
        if (isRomanUpper) {
            return LEVEL_ROMAN_UPPER;
        }
        
        if (isLetter) {
            return LEVEL_LETTER_UPPER;
        }
        
        // Multi-letter that's not Roman (like "AA", "AB") - treat as letter
        return LEVEL_LETTER_UPPER;
    }
    
    return null;
}

function applyNestedOutlineStyles(doc) {
    var selection = doc.selection[0];
    var paragraphs;
    
    if (!selection) {
        alert("Please select text or place cursor in a story.");
        return;
    }
    
    // If selection has multiple paragraphs, use selection; otherwise use story
    if (selection.hasOwnProperty('paragraphs') && selection.paragraphs.length > 1) {
        paragraphs = selection.paragraphs;
    } else if (selection.hasOwnProperty('parentStory')) {
        paragraphs = selection.parentStory.paragraphs;
    } else if (selection.hasOwnProperty('paragraphs')) {
        paragraphs = selection.paragraphs[0].parentStory.paragraphs;
    } else {
        alert("Could not determine the story from selection.");
        return;
    }
    
    // Ensure all target styles exist
    var baseStyleName = "Heading 2 Translation";
    for (var level in LEVEL_STYLES) {
        ensureStyleExists(doc, LEVEL_STYLES[level], baseStyleName);
    }
    
    var changedCount = 0;
    var lastLevelByType = {};  // Track order of level assignments
    var orderCounter = 0;
    
    for (var i = 0; i < paragraphs.length; i++) {
        var paragraph = paragraphs[i];
        var stylePath = getStylePath(paragraph.appliedParagraphStyle);
        
        // Check if this paragraph has one of the source styles
        var isSourceStyle = false;
        for (var s = 0; s < SOURCE_STYLES.length; s++) {
            if (stylePath === SOURCE_STYLES[s]) {
                isSourceStyle = true;
                break;
            }
        }
        
        if (!isSourceStyle) {
            continue;
        }
        
        var content = paragraph.contents;
        var prefix = parsePrefix(content);
        
        if (!prefix) {
            continue;
        }
        
        var level = determineLevel(prefix, lastLevelByType);
        
        if (!level || !LEVEL_STYLES[level]) {
            continue;
        }
        
        // Update tracking
        orderCounter++;
        lastLevelByType[level] = orderCounter;
        
        // Find the target style
        var targetStyle = findStyleByPath(LEVEL_STYLES[level], 'paragraph');
        
        if (targetStyle) {
            // Apply the new style
            paragraph.appliedParagraphStyle = targetStyle;
            
                        
            // If it's lowercase letter (a. b. c.), rename to number with paren (1) 2) 3))
            if (level === LEVEL_LETTER_LOWER) {
                var letterIndex = -1;
                for (var li = 0; li < LETTERS_LOWER.length; li++) {
                    if (LETTERS_LOWER[li] === prefix.value) {
                        letterIndex = li;
                        break;
                    }
                }
                if (letterIndex !== -1) {
                    var newNumber = (letterIndex + 1) + ') ';
                    paragraph.contents = content.replace(prefix.full, newNumber);
                }
            }
            
            changedCount++;
        }
    }
    
    alert("Updated " + changedCount + " paragraph(s).");
}

main();
