"use strict";

var app;
$(function () {
  Vue.component('tibetan-input', {
    props: ['value'],
    template: "\n      <div class=\"ui form\" style=\"position: relative;\">\n        <div v-if=\"!value\" id=\"tibetan-placeholder\">\n          Input the tibetan here...\n        </div>\n        <textarea\n          v-bind:value=\"value\"\n          v-on:input=\"$emit('input', $event.target.value)\"\n          spellcheck=\"false\"\n          id=\"tibetan\"\n        ></textarea>\n      </div>\n    ",
    mounted: function mounted() {
      var that = this;
      $('#tibetan').autosize();
      $('#tibetan').on('paste', function (event) {
        event.preventDefault();
        var pastedData = event.originalEvent.clipboardData.getData('text/plain');
        that.$emit('paste', pastedData);
        setTimeout(function () {
          //$('#tibetan').trigger('input');
          updateHeight();
        }, 100);
      });
    }
  });
  Vue.component('converted-lines', {
    props: {
      expectedConverted: String,
      lines: Array
    },
    methods: {
      expectedLines: function expectedLines() {
        return this.expectedConverted.split("\n");
      },
      emitClickPart: function emitClickPart(result) {
        this.$emit('click-part', result);
      }
    },
    computed: {
      convertedLines: function convertedLines() {
        var that = this;
        return this.lines.map(function (line, index) {
          return {
            expected: that.expectedLines()[index],
            actual: new TibetanUnicodeConverter(line).convert().capitalize()
          };
        });
      }
    },
    template: "\n      <div id=\"converted\">\n        <test-diff\n          class=\"line\"\n          v-for=\"(line, index) in convertedLines\"\n          v-bind:key=\"index\"\n          v-bind:lineIndex=\"index\"\n          v-bind:expected=\"line.expected\"\n          v-bind:actual=\"line.actual\"\n          v-on:click-part=\"emitClickPart($event)\"\n        ></test-diff>\n      </div>\n    "
  });
  Vue.component('test-diff', {
    props: {
      lineIndex: Number,
      expected: String,
      actual: String
    },
    computed: {
      parts: function parts() {
        return JsDiff.diffChars(this.expected, this.actual);
      }
    },
    methods: {
      emitClickPart: function emitClickPart(clickedPart, clickedPartIndex) {
        var parts = this.parts;
        var updatedLine = '';

        _(parts).each(function (part, index) {
          if (clickedPart == parts[index - 1] && part.added) updatedLine += part.value;else if (clickedPart == part && part.added) updatedLine += part.value;else {
            if (part.removed && !(clickedPart == part) && !(clickedPart == parts[index + 1] && parts[index + 1].added)) updatedLine += part.value;
            if (!part.removed && !part.added) updatedLine += part.value;
          }
        });

        this.$emit('click-part', {
          lineIndex: this.lineIndex,
          updatedLine: updatedLine
        });
      }
    },
    template: "\n      <div>\n        <span\n          v-for=\"(part, partIndex) in parts\"\n          v-on:click=\"(part.added || part.removed) && emitClickPart(part, partIndex)\"\n          v-bind:style=\"[part.added ? {color: '#2185d0', 'font-weight': 'bold'} : '', part.removed ? {color: '#db2828', 'font-weight': 'bold'} : '']\"\n          >{{part.added || part.removed ? part.value.replace(/ /, '_') : part.value}}</span>\n      </div>\n    "
  });
  app = new Vue({
    el: '#main',
    data: {
      encoded: "\n        oe\xD7\xF1\xCE\n        >\xEB-{,-8\xDF:-b\xDC-\xB9\xA5/-e$-020<\xCE\n        \xFDV-#\xE8-<9-Z\xEB$-\xFD\xEB-:\xCE\n        8-02,-0&\xEB#-#\xDC-+$\xEB<-i\xE1/-/C\xE8<\xCE\n        \xFDV-7e\xB3$-#,<-5\xE8<-<\xDF-i#<\xCE\n        7\"\xEB9-\xB8\xA5-0\"7-7i\xEB-0$-\xFD\xEB<-/U\xEB9\xCE\n        a\xE8+-`\xDC-B\xE8<-<\xDF-/+#-/\u2026\xE5/-`\xDC<\xCE\n        e\xDC,-b\xDC<-/x/-d\xDC9-#;\xE8#<-<\xDF-#<\xEB:\xCE\n        \u03BC\xA5-9\xDF-\xFDV-<\xDCK\xDC-oe\xD7\xF1\xCE\n      ".replace(/^[ ]*/gm, '').trim(),
      tibetan: "\n        \u0F67\u0F75\u0F83\u0F14\n        \u0F68\u0F7C\u0F0B\u0F62\u0F92\u0FB1\u0F53\u0F0B\u0F61\u0F74\u0F63\u0F0B\u0F42\u0FB1\u0F72\u0F0B\u0F53\u0F74\u0F56\u0F0B\u0F56\u0FB1\u0F44\u0F0B\u0F58\u0F5A\u0F58\u0F66\u0F14\n        \u0F54\u0F51\u0FA8\u0F0B\u0F42\u0F7A\u0F0B\u0F66\u0F62\u0F0B\u0F66\u0FA1\u0F7C\u0F44\u0F0B\u0F54\u0F7C\u0F0B\u0F63\u0F14\n        \u0F61\u0F0B\u0F58\u0F5A\u0F53\u0F0B\u0F58\u0F46\u0F7C\u0F42\u0F0B\u0F42\u0F72\u0F0B\u0F51\u0F44\u0F7C\u0F66\u0F0B\u0F42\u0FB2\u0F74\u0F56\u0F0B\u0F56\u0F6A\u0F99\u0F7A\u0F66\u0F14\n        \u0F54\u0F51\u0FA8\u0F0B\u0F60\u0F56\u0FB1\u0F74\u0F44\u0F0B\u0F42\u0F53\u0F66\u0F0B\u0F5E\u0F7A\u0F66\u0F0B\u0F66\u0F74\u0F0B\u0F42\u0FB2\u0F42\u0F66\u0F14\n        \u0F60\u0F41\u0F7C\u0F62\u0F0B\u0F51\u0F74\u0F0B\u0F58\u0F41\u0F60\u0F0B\u0F60\u0F42\u0FB2\u0F7C\u0F0B\u0F58\u0F44\u0F0B\u0F54\u0F7C\u0F66\u0F0B\u0F56\u0F66\u0F90\u0F7C\u0F62\u0F14\n        \u0F41\u0FB1\u0F7A\u0F51\u0F0B\u0F40\u0FB1\u0F72\u0F0B\u0F62\u0F97\u0F7A\u0F66\u0F0B\u0F66\u0F74\u0F0B\u0F56\u0F51\u0F42\u0F0B\u0F56\u0F66\u0F92\u0FB2\u0F74\u0F56\u0F0B\u0F40\u0FB1\u0F72\u0F66\u0F14\n        \u0F56\u0FB1\u0F72\u0F53\u0F0B\u0F42\u0FB1\u0F72\u0F66\u0F0B\u0F56\u0F62\u0FB3\u0F56\u0F0B\u0F55\u0FB1\u0F72\u0F62\u0F0B\u0F42\u0F64\u0F7A\u0F42\u0F66\u0F0B\u0F66\u0F74\u0F0B\u0F42\u0F66\u0F7C\u0F63\u0F14\n        \u0F42\u0F74\u0F0B\u0F62\u0F74\u0F0B\u0F54\u0F51\u0FA8\u0F0B\u0F66\u0F72\u0F51\u0FA1\u0FB7\u0F72\u0F0B\u0F67\u0F75\u0F83\u0F14\n      ".replace(/^[ ]*/gm, '').trim()
    },
    computed: {
      lines: function lines() {
        return this.encoded ? this.encoded.split("\n") : [];
      }
    },
    methods: {
      correctSource: function correctSource(result) {
        var lines = this.encoded.split("\n");
        lines[result.lineIndex] = result.updatedLine;
        this.encoded = lines.join("\n");
      }
    },
    template: "\n      <div class=\"ui container compare\">\n        <div id=\"scrollable-area-container\">\n          <div id=\"scrollable-area\">\n            <div class=\"form\">\n              <textarea\n                id=\"encoded\"\n                v-model=\"encoded\"\n                v-on:paste=\"encoded = $event\"\n              ></textarea>\n            </div>\n            <tibetan-input\n              v-model=\"tibetan\"\n              v-on:paste=\"tibetan = $event\"\n            ></tibetan-input>\n            <div class=\"form\">\n              <converted-lines\n                v-bind:lines=\"lines\"\n                v-bind:expectedConverted=\"tibetan\"\n                v-on:click-part=\"correctSource($event)\"\n              ></converted-lines>\n            </div>\n          </div>\n        </div>\n      </div>\n    "
  });
});