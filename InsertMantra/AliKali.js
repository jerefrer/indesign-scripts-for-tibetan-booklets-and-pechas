var mantraText =
  "A ā    i ī    u ū    ṛ ṝ    ḷ ḹ    é ai    o au    aṁ a\r" +
  "Ka kha ga gha nga    Ca cha ja jha nya    \r" +
  "Ṭa ṭha ḍa ḍha ṇa    Ta tha da dhana    \r" +
  "Pa pha ba bha ma    Ya ra la va    Śa ṣa sa ha kṣa";

var selection = app.selection[0];
if (selection && selection.hasOwnProperty("contents")) {
  selection.contents = mantraText;
} else if (selection && selection.insertionPoints) {
  selection.insertionPoints.item(0).contents = mantraText;
} else {
  alert("Place the cursor in a text frame before running this script.");
}
