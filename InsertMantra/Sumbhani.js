var mantraText = "Oṁ suṁbhani suṁbhani hūṁ    Gṛhaṇa gṛhaṇa hūṁ    Gṛhaṇapāya    Gṛhaṇapāya hūṁ    Ānaya ho    Bhagavān vidya rāja krodha hūṁ phaṭ";

var selection = app.selection[0];
if (selection && selection.hasOwnProperty("contents")) {
  selection.contents = mantraText;
} else if (selection && selection.insertionPoints) {
  selection.insertionPoints.item(0).contents = mantraText;
} else {
  alert("Place the cursor in a text frame before running this script.");
}
