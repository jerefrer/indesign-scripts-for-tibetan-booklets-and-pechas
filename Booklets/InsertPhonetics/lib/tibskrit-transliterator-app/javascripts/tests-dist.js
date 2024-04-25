"use strict";

$(function () {
  Vue.component('test-diff', {
    props: {
      expected: String,
      actual: String
    },
    computed: {
      parts: function parts() {
        return JsDiff.diffChars(this.expected, this.actual);
      }
    },
    template: "\n      <span style=\"margin-left: 20px; font-size: 1.2em\">\n        <span\n          v-for=\"part in parts\"\n          v-bind:style=\"[part.added ? {color: '#2185d0', 'font-weight': 'bold'} : '', part.removed ? {color: '#db2828', 'font-weight': 'bold'} : '']\"\n          >{{part.added || part.removed ? part.value.replace(/ /, '_') : part.value}}</span>\n      </span>\n    "
  });
  Vue.component('test-result', {
    props: {
      test: Object,
      sentence: Boolean
    },
    computed: {
      expected: function expected() {
        return this.test.tibetan;
      },
      actual: function actual() {
        return this.test.converted;
      },
      spanStyle: function spanStyle() {
        var s = {};
        if (!this.sentence) s['width'] = '120px;';else s['display'] = 'block';
        return s;
      },
      tibetanStyle: function tibetanStyle() {
        var s = {};
        if (!this.sentence) s['width'] = '30px;';
        return s;
      }
    },
    template: "\n      <span\n        class=\"ui black label test\" v-bind:style=\"spanStyle\"\n        v-on:click=\"test.runTest()\"\n        >\n        <span>\n          <i v-if=\" test.pass\" class=\"check green icon\"></i>\n          <i v-if=\"!test.pass\" class=\"times red icon\"></i>\n        </span>\n        <span class=\"tibetan\" v-bind:style=\"tibetanStyle\">{{test.tibetan}}</span>\n        <test-diff\n          v-if=\"expected != actual\"\n          v-bind:expected=\"expected\"\n          v-bind:actual=\"actual\"\n        ></test-diff>\n      </span>\n    "
  });
  Vue.component('results-group', {
    props: {
      name: String,
      sentences: Boolean,
      tests: Array
    },
    data: function data() {
      var passedCount = this.tests.count(function (test) {
        return test.pass;
      });
      var allPassed = passedCount == this.tests.length;
      return {
        allPassed: allPassed,
        opened: allPassed,
        passedCount: passedCount,
        total: this.tests.length
      };
    },
    template: "\n      <tr\n        class=\"ui inverted segment results-group\">\n        <td class=\"header\"\n          v-on:click=\"opened=!opened\"\n        >\n          {{name}}\n        </td>\n        <td class=\"count\">{{passedCount}}/{{total}}</td>\n        <td class=\"result\">\n          <i v-if=\" allPassed\" class=\"check green icon\"></i>\n          <i v-if=\"!allPassed\" class=\"times red icon\"></i>\n        </td>\n        <td>\n          <test-result\n            v-if=\"!opened\"\n            v-for=\"(test, index) in tests\"\n            v-bind:sentence=\"sentences\"\n            v-bind:test=\"test\"\n            v-bind:key=\"index\"\n          >\n          </test-result>\n        </td>\n      </tr>\n    "
  });
  new Vue({
    el: '#main',
    data: function data() {
      var passedCount = 0;
      var textsPassed = 0;
      var textsTotal = 0;
      var ranTests = testGroups.map(function (testGroup) {
        testGroup.tests.each(function (test) {
          test.runTest = function () {
            this.converted = new TibetanUnicodeConverter(this.conversion).convert();
            return this.converted == this.tibetan;
          };

          test.pass = test.runTest();
          if (test.pass) passedCount++;

          if (testGroup.includeInPercentage) {
            if (test.pass) textsPassed++;
            textsTotal++;
          }
        });
        return testGroup;
      });

      var total = _(testGroups).pluck('tests').flatten().length;

      return {
        tests: ranTests,
        passedCount: passedCount,
        total: total,
        textsPassed: textsPassed,
        textsTotal: textsTotal,
        percentage: passedCount / total * 100,
        percentageTexts: textsPassed / textsTotal * 100
      };
    },
    computed: {
      style: function style() {
        return {
          color: this.passedCount == this.total ? '#21ba45' : '#db2828'
        };
      }
    },
    template: "\n      <div>\n        <table class=\"ui inverted definition table\">\n          <thead>\n            <tr>\n              <td class=\"ui inverted header\">\n                Total: <span v-bind:style=\"style\">{{percentage.toPrecision(3)}}% ({{passedCount}}/{{total}})</span>\n                <span v-if=\"passedCount != total\">\n                   \u2014\n                  Texts only:\n                  <span v-bind:style=\"style\">{{percentageTexts.toPrecision(3)}}% ({{textsPassed}}/{{textsTotal}})</span>\n                </span>\n              </td>\n            </tr>\n          </thead>\n          <tbody>\n            <results-group\n             v-for=\"(test, index) in tests\"\n             v-bind:key=\"index\"\n             v-bind:name=\"test.name\"\n             v-bind:sentences=\"test.sentences\"\n             v-bind:tests=\"test.tests\">\n            </results-group>\n          </tbody>\n        </table>\n      </div>\n    "
  });
});