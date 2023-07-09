app.findGrepPreferences=app.changeGrepPreferences=null;
app.findGrepPreferences.findWhat="༑";
app.changeGrepPreferences.changeTo="།";
app.activeDocument.changeGrep();

app.findGrepPreferences.findWhat="ང་";
app.changeGrepPreferences.changeTo="ང༌";
app.activeDocument.changeGrep();

var lines = app.selection[0].paragraphs[0].lines.everyItem().getElements();
while (lines.length) {
    var line = lines.shift();
    line.contents = line.contents.replace(/^([^་༌།༔  ]+[་༌]?)།([^།])/, "$1༑$2");
}