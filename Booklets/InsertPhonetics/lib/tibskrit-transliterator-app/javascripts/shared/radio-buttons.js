Vue.component('radio-buttons', {
  props: {
    name: String,
    value: [String, Number, Boolean],
    choices: Array
  },
  mounted: function() {
    $(this.$refs.radios).checkbox();
  },
  template: `
    <div class="inline fields">
      <div class="inline field" v-for="choice in choices">
        <div class="ui radio checkbox" ref="radios">
          <input
            type="radio"
            tabindex="0"
            class="hidden"
            :name="name"
            :value="choice.value"
            :checked="choice.value == value"
            @change="$emit('input', choice.value)"
          />
          <label>
            {{choice.text}}
          </label>
        </div>
      </div>
    </div>
  `
})