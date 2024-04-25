Vue.component('slider-checkbox', {
  model: {
    prop: 'value'
  },
  props: {
    value: Boolean,
    text: String
  },
  mounted: function() {
    $(this.$refs.checkbox).checkbox({
      onChange: (input) =>
        this.$emit('input', $(this.$refs.checkbox).checkbox('is checked'))
    });
  },
  template: `
    <div class="ui slider checkbox" ref="checkbox">
      <input type="checkbox" :checked="value">
      <label>{{text}}</label>
    </div>
  `
})