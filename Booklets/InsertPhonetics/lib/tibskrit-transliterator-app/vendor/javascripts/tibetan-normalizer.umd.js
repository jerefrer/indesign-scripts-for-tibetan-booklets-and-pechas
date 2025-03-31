(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.TibetanNormalizer = factory());
})(this, (function () { 'use strict';

  var tibetanNormalizer = {

    normalize (text) {
      var normalized = this.normalizeCombinedLetters(text);
      normalized = this.normalizeTsheks(normalized);
      return normalized;
    },

    normalizeTsheks (text) {
      return text
        .replace(/(ཾ)([ཱཱཱེིོིྀུུ])/g, '$2$1') // Malformed: anusvara before vowel
        .replace(/༌/g, '་') // Alternative tshek
        .replace(/་+/g, '་'); // Multiple consecutive tsheks into one
    },

    normalizeCombinedLetters (text) {
      return text
        .replace(/[ ]/g, ' ')
        .replace(/ༀ/g, 'ཨོཾ')
        .replace(/ཀྵ/g, 'ཀྵ')
        .replace(/བྷ/g, 'བྷ')
        .replace(/ི+/g, 'ི')
        .replace(/ུ+/g, 'ུ')
        .replace(/ཱུ/g, 'ཱུ')
        .replace(/ཱི/g, 'ཱི')
        .replace(/ཱྀ/g, 'ཱྀ')
        .replace(/དྷ/g, 'དྷ')
        .replace(/གྷ/g, 'གྷ')
        .replace(/ཪླ/g, 'རླ')
        .replace(/ྡྷ/g, 'ྡྷ')
        .replace(//g, '࿓༅')
        .replace(//g, 'སྤྲ')
        .replace(//g, 'ུ')
        .replace(//g, 'ག')
        .replace(//g, 'ུ')
        .replace(//g, 'རྒྱ')
        .replace(//g, 'གྲ')
        .replace(//g, 'ུ')
        .replace(//g, 'ི')
        .replace(//g, 'བྱ')
        .replace(//g, 'སྲ')
        .replace(//g, 'སྒྲ')
        .replace(//g, 'ལྷ')
        .replace(//g, 'ོ')
        .replace(//g, 'གྱ')
        .replace(//g, 'རླ')
        .replace(//g, 'ཕྱ')
        .replace(//g, 'སྩ')
        .replace(//g, 'རྡ')
        .replace(//g, 'རྗ')
        .replace(//g, 'དྲྭ')
        .replace(//g, 'ཛྲ')
        .replace(//g, 'ལྷྭ')
        .replace(//g, 'སྤྱ')
        .replace(//g, 'བྷྱ')
        .replace(//g, 'གྷྣ')
        .replace(//g, 'གྷྲ')
        .replace(//g, 'ནྡྷ')
        .replace(//g, 'ཧྣ')
        .replace(//g, 'ཥྚ')
        .replace(//g, 'བྷྲ')
        .replace(//g, 'ཱུ')
        .replace(//g, 'ཱུ')
        .replace(//g, 'རྒྷ')
        .replace(//g, 'ྀ')
        .replace(//g, 'ཱ')
        .replace(//g, 'ཱ')
        .replace(//g, 'དྡྷྭ')
        .replace(//g, 'ིཾ')
        .replace(//g, 'ིཾ')
        .replace(//g, 'ངྷ')
    }

  };

  return tibetanNormalizer;

}));
