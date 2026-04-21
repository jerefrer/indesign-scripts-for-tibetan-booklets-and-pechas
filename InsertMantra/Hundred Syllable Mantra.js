var mantraText =
  "Oṃ vajrasatva samayam anupālaya    Vajrasatva tvenopatiṣṭha    Dṛḍho mé bhava    Sutoṣyo mé bhava    Anurakto mé bhava    Supoṣyo mé bhava    Sarvasiddhiṃ mé prayaccha    Sarvakarmasu ca mé cittaṃ    Śreyāṃḥ kuru hūṃ    Ha ha ha ha hoḥ    Bhagavān    Sarvatathāgata    Vajra mā mé muñca    Vajrī bhava    Mahāsamayasatva āḥ";

var selection = app.selection[0];
if (selection && selection.hasOwnProperty("contents")) {
  selection.contents = mantraText;
} else if (selection && selection.insertionPoints) {
  selection.insertionPoints.item(0).contents = mantraText;
} else {
  alert("Place the cursor in a text frame before running this script.");
}
