#include '../../lib/polyfills.js';

var doc = app.activeDocument;
var startPage = 1;
var startFromPage = 8;

for (var i = startPage; i <= doc.pages.length; i++) {
    var pageNumber = Math.floor((i - startFromPage)/ 2 + 1);
    var page = doc.pages[i-1];
    
    for (var j = 0; j < page.textFrames.length; j++) {
        var textFrame = page.textFrames[j];
        var contents = textFrame.contents.trim();

        // Check if the text frame contains a single number
        if (/^\d+$/.test(contents)) {
            textFrame.contents = pageNumber.toString();
        }
    }
}
