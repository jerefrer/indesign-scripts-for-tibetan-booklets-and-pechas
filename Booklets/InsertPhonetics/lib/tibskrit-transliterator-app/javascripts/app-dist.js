"use strict";

var app;
$(function () {
  Vue.component('converted-lines', {
    props: {
      language: String,
      lines: Array
    },
    computed: {
      convertedLines: function convertedLines() {
        return this.lines.map(function (line) {
          return new TibetanUnicodeConverter(line).convert();
        }).join("\n");
      }
    },
    mounted: function mounted() {
      new Clipboard('#copy-to-clipboard');
    },
    template: "\n      <div class=\"ui form\">\n        <textarea\n          id=\"transliteration\"\n          class=\"tibetan\"\n          readonly=\"\"\n        >{{convertedLines}}</textarea>\n      </div>\n    "
  });
  app = new Vue({
    el: '#main',
    data: {
      text: "\n        oe\xD7\xF1\xCE\n        >\xEB-{,-8\xDF:-b\xDC-\xB9\xA5/-e$-020<\xCE\n        \xFDV-#\xE8-<9-Z\xEB$-\xFD\xEB-:\xCE\n        8-02,-0&\xEB#-#\xDC-+$\xEB<-i\xE1/-/C\xE8<\xCE\n        \xFDV-7e\xB3$-#,<-5\xE8<-<\xDF-i#<\xCE\n        7\"\xEB9-\xB8\xA5-0\"7-7i\xEB-0$-\xFD\xEB<-/U\xEB9\xCE\n        a\xE8+-`\xDC-B\xE8<-<\xDF-/+#-/\u2026\xE5/-`\xDC<\xCE\n        e\xDC,-b\xDC<-/x/-d\xDC9-#;\xE8#<-<\xDF-#<\xEB:\xCE\n        \u03BC\xA5-9\xDF-\xFDV-<\xDCK\xDC-oe\xD7\xF1\xCE\n      ".replace(/ /g, '').trim()
    },
    computed: {
      lines: function lines() {
        return this.text ? this.text.split("\n") : [];
      }
    },
    template: "\n      <div class=\"ui container\">\n        <div id=\"scrollable-area-container\">\n          <clipboard-button v-if=\"text\"></clipboard-button>\n          <div id=\"scrollable-area\">\n            <div class=\"ui form\">\n              <textarea v-model=\"text\"></textarea>\n            </div>\n            <converted-lines\n              v-bind:lines=\"lines\"\n            ></converted-lines>\n          </div>\n        </div>\n      </div>\n    "
  });
});