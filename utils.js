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