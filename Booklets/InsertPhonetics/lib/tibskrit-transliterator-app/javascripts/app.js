var app;

$(function() {

  Vue.component('converted-lines', {
    props: {
      options: Object,
      lines: Array
    },
    computed: {
      convertedLines: function() {
        return this.lines.map((line) =>
          new TibkritTransliterator(line).transliterate(this.options)
        ).join("\n");
      },
    },
    mounted: function() {
      new Clipboard('#copy-to-clipboard');
    },
    template: `
      <div class="ui form">
        <textarea
          id="transliteration"
          class="result"
          readonly=""
        >{{convertedLines}}</textarea>
      </div>
    `
  })

  app = new Vue({
    el: '#main',
    data: {
      options: Storage.get('options') || {
        capitalize: false,
        phonetics: false
      },
      text: Storage.get('text') || `
        ཨོཾ་ཨཱཿཧཱུྃ།
        ཨོཾ་ཨཱཿཧཱུྃ་སྭཱ་ཧཱ།
        ཨོཾ་ཧཱུྃ་ཏྲཱཾ་ཧྲཱིཿཨཱཿ
        འཿཨཿཧཿཤཿསཿམཿ
        ཨོཾ་བཛྲ་སཏྭ་ཧཱུྃ།
        ན་མཿས་མནྟ་བུདྡྷཱ་ནཱཾ། ཨཱ་བཱི་ར་ཧཱུྃ་ཁཾ།
      `.replace(/^ +/gm, '').trim()
    },
    watch: {
      text (value) {
        Storage.set('text', value);
      },
      options: {
        deep: true,
        handler (value) {
          Storage.set('options', value);
        }
      }
    },
    computed: {
      lines: function() {
        return this.text ? this.text.split("\n") : [];
      }
    },
    mounted () {
      $(this.$refs.tibetan).autosize();
    },
    updated () {
      this.$nextTick(() => $(window).resize());
    },
    template: `
      <div class="ui container">
        <div id="menu" class="ui form">
          <radio-buttons
            v-model="options.phonetics"
            :choices="[
              {value: false, text: 'Sanskrit transliteration'},
              {value: true,  text: 'Phonetics'}
            ]"
          />
          <slider-checkbox
            v-model="options.capitalize"
            text="Capital letter at the beginning of each group"
          />
        </div>
        <div id="scrollable-area-container">
          <clipboard-button v-if="text"></clipboard-button>
          <div id="scrollable-area">
            <div class="ui form">
              <textarea ref="tibetan" v-model="text" class="tibetan"></textarea>
            </div>
            <converted-lines
              :lines="lines"
              :options="options"
            ></converted-lines>
          </div>
        </div>
      </div>
    `
  })

})