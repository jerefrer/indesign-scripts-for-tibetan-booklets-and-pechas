Vue.component('encoded-input', {
  props: ['value'],
  methods: {
    selectTextarea: function() {
      $('#encoded').focus();
    }
  },
  template: `
    <div class="ui form" style="position: relative;">
      <div v-if="!value" id="encoded-placeholder" v-on:click="selectTextarea">
        Try inputing some cryptic symbols here...
      </div>
      <textarea
        v-bind:value="value"
        v-on:input="$emit($event.target.value)"
        id="encoded"
        class="encoded"
        autofocus="true"
      ></textarea>
    </div>
  `,
  updated: function(object) {
    $('#encoded').autosize();
    setTimeout(function() {
      $('#transliteration').css('height', $('textarea.encoded').css('height'));
    }, 0)
  }
});