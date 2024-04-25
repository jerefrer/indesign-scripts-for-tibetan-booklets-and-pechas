#include '../lib/utils.jsx'
#include '../lib/ProgressBar.jsx'

app.findGrepPreferences = app.changeGrepPreferences = null;

app.findGrepPreferences.findWhat = "༑";
app.changeGrepPreferences.changeTo = "།";
app.activeDocument.changeGrep();

var paragraphs = app.selection[0].paragraphs.everyItem().getElements();
var allLines = [];
while (paragraphs.length) {
    var paragraph = paragraphs.shift();
    var lines = paragraph.lines.everyItem().getElements();
    allLines.concat(lines);
}

var i = 0;
var progressBar = new $.ProgressBar("Rinchen Spung Shad", 350, 100);
progressBar.show("Processing line %1 / " + lines.length, lines.length, i);

for(; i < lines.length; i++) {
    var line = lines[i];
    var match = line.contents.match(/^([^་༌།༔  ]+[་༌]?)།([^།])/);
    if (match) {
        app.findGrepPreferences = app.changeGrepPreferences = null;
        app.findGrepPreferences.findWhat = "("+match[1]+")།([^།])(.*)";
        app.changeGrepPreferences.changeTo = "$1༑$2$3";
        line.changeGrep();
        progressBar.hitValue(i);
        progressBar.hit(i);
        $.sleep(100);
    }
}

$.sleep(500);
progressBar.msg("Done!");
$.sleep(1500);

// Quit
// ---
progressBar.close();