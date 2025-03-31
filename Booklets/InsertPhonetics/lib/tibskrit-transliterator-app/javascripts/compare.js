var app;
$(function() {
  Vue.component('tibetan-input', {
    props: ['value'],
    template: `
      <div class="ui form" style="position: relative;">
        <div v-if="!value" id="tibetan-placeholder">
          Input the tibetan here...
        </div>
        <textarea
          v-bind:value="value"
          v-on:input="$emit('input', $event.target.value)"
          spellcheck="false"
          id="tibetan"
        ></textarea>
      </div>
    `,
    mounted: function() {
      var that = this;
      $('#tibetan').autosize();
      $('#tibetan').on('paste', function(event) {
        event.preventDefault();
        var pastedData = event.originalEvent.clipboardData.getData('text/plain');
        that.$emit('paste', pastedData);
        setTimeout(function() {
          //$('#tibetan').trigger('input');
          updateHeight();
        }, 100)
      });
    }
  });
  Vue.component('diff-lines', {
    props: {
      expectedConverted: String,
      lines: Array
    },
    methods: {
      expectedLines: function() {
        return this.expectedConverted.split("\n");
      },
      emitClickPart: function(result) {
        this.$emit('click-part', result);
      }
    },
    computed: {
      existingLines: function() {
        var that = this;
        return this.lines.map(function(line, index) {
          return {
            expected: that.expectedLines()[index],
            actual: new TibkritTransliterator(line).transliterate()
          }
        });
      },
    },
    template: `
      <div id="diff-lines">
        <test-diff
          class="line"
          v-for="(line, index) in existingLines"
          v-bind:key="index"
          v-bind:lineIndex="index"
          v-bind:expected="line.expected"
          v-bind:actual="line.actual"
          v-on:click-part="emitClickPart($event)"
        ></test-diff>
      </div>
    `
  })
  Vue.component('test-diff', {
    props: {
      lineIndex: Number,
      expected: String,
      actual: String
    },
    computed: {
      parts: function() {
        return JsDiff.diffChars(this.expected, this.actual);
      }
    },
    methods: {
      emitClickPart: function(clickedPart, clickedPartIndex) {
        var parts = this.parts;
        var updatedLine = '';
        _(parts).each(function(part, index) {
          if (clickedPart == parts[index-1] && part.added) updatedLine += part.value;
          else if (clickedPart == part && part.added) updatedLine += part.value;
          else {
            if (part.removed && !(clickedPart == part) && !(clickedPart == parts[index+1] && parts[index+1].added)) updatedLine += part.value;
            if (!part.removed && !part.added) updatedLine += part.value;
          }
        });
        this.$emit('click-part', {
          lineIndex: this.lineIndex,
          updatedLine: updatedLine
        });
      }
    },
    template: `
      <div>
        <span
          v-for="(part, partIndex) in parts"
          v-on:click="(part.added || part.removed) && emitClickPart(part, partIndex)"
          v-bind:style="[part.added ? {color: '#2185d0', 'font-weight': 'bold'} : '', part.removed ? {color: '#db2828', 'font-weight': 'bold'} : '']"
          >{{part.added || part.removed ? part.value.replace(/ /g, '_') : part.value}}</span>
      </div>
    `
  })
  app = new Vue({
    el: '#main',
    data: {
      tibetan: `
        ཨོཾ་ཨཱཿཧཱུྃ།
        ཨོཾ་ཨཱཿཧཱུྃ་སྭཱ་ཧཱ།
        ཨོཾ་ཧཱུྃ་ཏྲཱཾ་ཧྲཱིཿཨཱཿ
        འཿཨཿཧཿཤཿསཿམཿ
        ཨོཾ་བཛྲ་སཏྭ་ཧཱུྃ།
        ན་མཿས་མནྟ་བུདྡྷཱ་ནཱཾ། ཨཱ་བཱི་ར་ཧཱུྃ་ཁཾ།
      `.replace(/^[ ]*/gm, '').trim(),
      existing: `
        oṁ āḥ hūṁ
        oṁ āḥ hūṁ svāhā
        oṁ hūṁ trāṁ hrīḥ āḥ
        āḥ aḥ haḥ śaḥ saḥ maḥ
        oṁ vajra sattva hūṁ
        namaḥsamanta buddhānāṁ  ābīra hūṁ khaṁ
      `.replace(/^[ ]*/gm, '').trim()
    },
    computed: {
      lines: function() {
        return this.tibetan ? this.tibetan.split("\n") : [];
      }
    },
    methods: {
      correctSource: function(result) {
        var lines = this.existing.split("\n");
        lines[result.lineIndex] = result.updatedLine;
        this.existing = lines.join("\n");
      }
    },
    template: `
      <div class="ui container compare">
        <div id="scrollable-area-container">
          <div id="scrollable-area">
            <tibetan-input
              v-model="tibetan"
              @paste="tibetan = $event"
            ></tibetan-input>
            <div class="form">
              <textarea
                id="existing"
                v-model="existing"
              ></textarea>
            </div>
            <div class="form">
              <diff-lines
                :lines="lines"
                :expectedConverted="existing"
                @click-part="correctSource($event)"
              ></diff-lines>
            </div>
          </div>
        </div>
      </div>
    `
  })
})