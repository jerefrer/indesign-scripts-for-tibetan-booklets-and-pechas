#include "./lib/insert-phonetics.js"

var retrievedData = document.extractLabel("selectedStyles");
var selectedStyles = retrievedData ? JSON.parse(retrievedData) : {};

if (requiredStylesAreSelected(selectedStyles)) {
  insertPhonetics(selectedStyles);
} else {
  openSettings();
}