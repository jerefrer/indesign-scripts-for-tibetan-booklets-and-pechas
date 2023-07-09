function alert_scroll (title, input){
    if (input instanceof Array)
        input = input.join ("\r");
    var w = new Window ("dialog", title);
    var list = w.add ("edittext", undefined, input, {multiline: true, scrolling: true});
    list.maximumSize.height = w.maximumSize.height-400;
    list.minimumSize.width = 800;
    w.add ("button", undefined, "Close", {name: "ok"});
    w.show ();
}


function getObjectProperties (object) {
    var _resultArray = [];
    for (var i = 0; i < object.reflect.properties.length; i++) {
        var property = object.reflect.properties[i];
        if (property.toString() === "__proto__" || property.toString() === "reflect" || property.toString() === "properties")
            continue;
        try { _result = object[property]; }
        catch (e) { _result = "cannot read"; }
        if (_result != null && _result.constructor.name === "Array")
            _resultArray.push(object.constructor.name + "." + property + " = [" + _result + "]");
        else
            _resultArray.push(object.constructor.name + "." + property + " = " + _result);
    }
    return _resultArray.sort();
}

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
    // alert_scroll("Object properties", getObjectProperties(line));
    var matches = line.contents.match(/[^￼]*|￼/g);
    alert_scroll(matches);
    line.contents = line.contents.match(/.*|￼/g).map(function(part) {
        return part.replace(/^([^་༌།༔  ]+[་༌]?)།([^།])/, "$1༑$2")
    }).join('');
}