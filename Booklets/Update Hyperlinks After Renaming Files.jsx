function updateHyperlinksDestination(oldName, newName) {
  var doc = app.activeDocument;
  var hyperlinks = doc.hyperlinks;
  
  for(var i = 0; i < hyperlinks.length; i++) {
      var link = hyperlinks[i];
      var destination = link.destination;
      if(destination.name && destination.name.indexOf(oldName) !== -1) {
          destination.name = destination.name.replace(oldName, newName);
      }
  }
}

var doc = app.activeDocument;
var hyperlinks = doc.hyperlinks;
debugger

updateHyperlinksDestination("Khandro Sangdu Drupchen - P.indd", "KS Drupchen P.indd");
updateHyperlinksDestination("Khandro Sangdu Drupchen - R.indd", "KS Drupchen R.indd");
alert("Hyperlinks updated");