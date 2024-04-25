"use strict";

Vue.component('clipboard-button', {
  data: function data() {
    return {
      text: 'Copy to clipboard'
    };
  },
  methods: {
    updateText: function updateText() {
      var that = this;
      this.text = 'Copied!';
      setTimeout(function () {
        that.text = 'Copy to clipboard';
      }, 1000);
    }
  },
  template: "\n    <div\n      id=\"copy-to-clipboard\"\n      data-clipboard-target=\"#transliteration\"\n      v-on:click=\"updateText\"\n    >\n      <i class=\"paste icon\"></i> {{text}}\n    </div>\n  "
});