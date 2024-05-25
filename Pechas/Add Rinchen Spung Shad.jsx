#include '../lib/utils.jsx'
#include '../lib/ProgressBar.jsx'

app.findGrepPreferences = app.changeGrepPreferences = null;

app.findGrepPreferences.findWhat = "༑";
app.changeGrepPreferences.changeTo = "།";
app.activeDocument.changeGrep();

var paragraphs = app.selection[0].parentStory.paragraphs.everyItem().getElements();
var allLines = [];
for (var j = 0; j < paragraphs.length; j++) {
    var paragraph = paragraphs[j];
    var lines = paragraph.lines.everyItem().getElements();
    allLines = allLines.concat(lines);
}

var i = 0;
var progressBar = new $.ProgressBar("Rinchen Spung Shad", 350, 100);
progressBar.show("Processing line %1 / " + allLines.length, allLines.length, i);

// var regexp = /^\uFEFF?([^་༌།༔  ]+[་༌]?)།([^།])/; // Any syllable followed by shed
var regexp = /^\uFEFF?^([ཀཁགངཅཆཇཉཏཊཐཋདཌནཎཔཕབམཙཚཛཝཞསའཡརཤཥཟཧཨ][ཱ]?[ེིོུ]?[ཾྃྂ]?[་༌]?)།([^།])/; // Single "column" syllable followed by shed

for(; i < allLines.length; i++) {
    var line = allLines[i];
    if (!line.contents.match(/^\uFEFF?༄༅/)) {
        var match = line.contents.match(regexp);
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
}

$.sleep(500);
progressBar.msg("Done!");
$.sleep(1500);

// Quit
// ---
progressBar.close();