// Define the terms and their replacements
var replacements = [
  ["Amitabha", "Amitābha"],
  ["Mamaki", "Māmaki"],
  ["Mahayoga", "Mahāyoga"],
  ["shamata", "śamatha"],
  ["shamatha", "śamatha"],
  ["Shravakayana", "Śrāvakayāna"],
  ["Mahayana", "Mahayāna"],
  ["Mahamudra", "Mahāmudrā"],
  ["Vajrayana", "Vajrayāna"],
  ["Vajrayogini", "Vajrayoginī"],
  ["Vajrayogini", "Vajrayoginī"],
  ["Vajra Yogini", "Vajra Yoginī"],
  ["samadhi", "samādhi"],
  ["nirmanakaya", "nirmāṇakāya"],
  ["sambogakaya", "saṃbhogakāya"],
  ["sambhogakaya", "saṃbhogakāya"],
  ["samboghakaya", "saṃbhogakāya"],
  ["dharmakaya", "dharmakāya"],
  ["buddhafield", "buddhāfield"],
  ["Mandala", "Maṇḍala"],
  ["Samaya", "Samaya"],
  ["Sangha", "Saṅgha"],
  ["Tathagata", "Tathāgata"],
  ["sutra", "sūtra"],
  ["tantra", "tantra"],
  ["mantra", "mantra"],
  ["mudra", "mudrā"],
  ["dakini", "ḍākinī"],
  ["prana", "prāṇa"],
  ["rupa", "rūpa"],
  ["jnana", "jñāna"],
  ["jñana", "jñāna"],
  ["shastra", "śāstra"],
  ["mandala", "maṇḍala"],
  ["sadhana", "sādhanā"],
  ["mahasiddha", "mahāsiddha"],
  ["Mahasiddha", "Mahāsiddha"],
  ["daka", "ḍāka"],
  ["dakini", "ḍākinī"],
];

// Function to replace terms in the document
function replaceTerms() {
  var doc = app.activeDocument;
  for (var i = 0; i < replacements.length; i++) {
      var searchTerm = replacements[i][0];
      var replaceTerm = replacements[i][1];
      
      // Find and replace the term
      app.findTextPreferences = NothingEnum.nothing;
      app.changeTextPreferences = NothingEnum.nothing;
      
      app.findTextPreferences.findWhat = searchTerm;
      app.changeTextPreferences.changeTo = replaceTerm;
      
      doc.changeText();
      
      // Clear find/change preferences
      app.findTextPreferences = NothingEnum.nothing;
      app.changeTextPreferences = NothingEnum.nothing;
  }
}

// Run the replace function
replaceTerms();
