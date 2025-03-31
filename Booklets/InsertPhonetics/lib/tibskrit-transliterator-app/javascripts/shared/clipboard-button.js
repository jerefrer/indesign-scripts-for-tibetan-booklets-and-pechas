Vue.component('clipboard-button', {
  data: function() {
    return {
      text: 'Copy to clipboard'
    }
  },
  methods: {
    updateText: function() {
      var that = this;
      this.text = 'Copied!'
      setTimeout(function() {
        that.text = 'Copy to clipboard';
      }, 1000)
    }
  },
  template: `
    <div
      id="copy-to-clipboard"
      data-clipboard-target="#transliteration"
      v-on:click="updateText"
    >
      <i class="paste icon"></i> {{text}}
    </div>
  `
});