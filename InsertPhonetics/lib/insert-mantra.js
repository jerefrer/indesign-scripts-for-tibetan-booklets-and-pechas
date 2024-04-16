#include "./json2.js"
#include "./shared.js"
#include "./tibkrit-transliterator/tibkrit-transliterator.js"

var document = app.activeDocument;
var selection = app.selection[0];

function insertMantra(isPhonetics) {
  var scriptLabel = document.extractLabel("selectedStyles");
  var selectedStyles = scriptLabel ? JSON.parse(scriptLabel) : {};
  
  var tibetanStyle = findStyleByPath(selectedStyles.tibetan, 'paragraph');
  var mantraStyle = selectedStyles.mantra ? findStyleByPath(selectedStyles.mantra, 'paragraph') : null;
  
  if (selection && selection.contents) {
    var selectedParagraphs = selection.paragraphs;
    
    for (var paragraphIndex = selectedParagraphs.length - 1; paragraphIndex >= 0; --paragraphIndex) {
      var paragraph = selectedParagraphs.item(paragraphIndex);
      processParagraph(paragraph, isPhonetics);
    }
  }
  
  function processParagraph(paragraph, isPhonetics) {  
    var followingParagraph = paragraph.insertionPoints.item(-1).paragraphs[0];
    // if (paragraph.appliedParagraphStyle === tibetanStyle && (!followingParagraph.isValid || followingParagraph.appliedParagraphStyle !== mantraStyle)) {
    if (paragraph.appliedParagraphStyle === tibetanStyle) {
      var tibkrit = new TibkritTransliterator(paragraph.contents);
      var transliteration = tibkrit.transliterate({ capitalize: true, phonetics: isPhonetics }).replace(/[\r\n]/g, '');
      if (transliteration.replace(/\s/g, '').length === 0) {
        return;
      }
      var insertionPoint = paragraph.insertionPoints.item(-1);
      insertionPoint.contents = "\r";
      
      var transliterationParagraph = insertionPoint.paragraphs[0];
      transliterationParagraph.contents = transliteration + "\r";
      transliterationParagraph.textStyleRanges[0].appliedCharacterStyle = findStyleByPath('[None]', 'character');
      transliterationParagraph.appliedParagraphStyle = mantraStyle;
    }
  }
}