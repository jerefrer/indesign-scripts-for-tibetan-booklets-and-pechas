"use strict";

Vue.component('encoded-input', {
  props: ['value'],
  methods: {
    selectTextarea: function selectTextarea() {
      $('#encoded').focus();
    }
  },
  template: "\n    <div class=\"ui form\" style=\"position: relative;\">\n      <div v-if=\"!value\" id=\"encoded-placeholder\" v-on:click=\"selectTextarea\">\n        Try inputing some cryptic symbols here...\n      </div>\n      <textarea\n        v-bind:value=\"value\"\n        v-on:input=\"$emit($event.target.value)\"\n        id=\"encoded\"\n        class=\"encoded\"\n        autofocus=\"true\"\n      ></textarea>\n    </div>\n  ",
  updated: function updated(object) {
    $('#encoded').autosize();
    setTimeout(function () {
      $('#transliteration').css('height', $('textarea.encoded').css('height'));
    }, 0);
  }
});