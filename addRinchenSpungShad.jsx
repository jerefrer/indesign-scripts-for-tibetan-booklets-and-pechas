String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

app.findGrepPreferences=app.changeGrepPreferences=null;
app.findGrepPreferences.findWhat="༑";
app.changeGrepPreferences.changeTo="།";
app.activeDocument.changeGrep();

app.findGrepPreferences.findWhat="ང་";
app.changeGrepPreferences.changeTo="ང༌";
app.activeDocument.changeGrep();

var paragraphs = app.selection[0].paragraphs.everyItem().getElements();
while (paragraphs.length) {
    var paragraph = paragraphs.shift();
    var lines = paragraph.lines.everyItem().getElements();
    while (lines.length) {
        var line = lines.shift();
        var match = line.contents.match(/^([^་༌།༔  ]+[་༌]?)།([^།])/);
        if (match)
          line.contents = line.contents.replaceAt(match.index + match[0].length-2, '༑');
    }
}