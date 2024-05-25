#include './lib/polyfills.js';

var doc = app.activeDocument;

for (var i = 0; i < doc.pages.length; i++) {
    var page = doc.pages[i];
    
    for (var j = page.textFrames.length - 1; j >= 0; j--) {
        var textFrame = page.textFrames[j];
        
        if (textFrame.contents.trim() === "") {
            textFrame.remove();
        }
    }
}
