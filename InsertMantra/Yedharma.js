var mantraText =
  "Oṁ yé dharmā hétu pra bhavāḥ    Hétun téṣān tathāgataé hya va dt    Téṣāncayo nirodha    Évaṁ vādī mahā śramaṇaḥ svāhā";

var selection = app.selection[0];
if (selection && selection.hasOwnProperty("contents")) {
  selection.contents = mantraText;
} else if (selection && selection.insertionPoints) {
  selection.insertionPoints.item(0).contents = mantraText;
} else {
  alert("Place the cursor in a text frame before running this script.");
}
