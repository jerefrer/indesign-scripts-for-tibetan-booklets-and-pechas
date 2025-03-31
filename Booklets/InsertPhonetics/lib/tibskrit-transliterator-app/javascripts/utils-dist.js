"use strict";

var updateHeight = function updateHeight() {
  var all = ['#tibetan', '#converted', '#encoded'];
  $(all.join(',')).css('height', 'auto').autosize();
  var highest = all.max(function (element) {
    return $(element).height();
  });
  var others = all.exclude(highest);
  $(highest).autosize();
  setTimeout(function () {
    var height = $(highest).css('height');

    _(others).each(function (element) {
      $(element).css('height', height);
    });
  }, 0);
};

var extractTransliteration = function extractTransliteration(text) {
  var lines = text.split("\n");
  var transliterationLines = [];

  _(lines).each(function (line) {
    if (line.match(/^[A-Z][ ]*\d*$/)) return; // Page number

    if (line.match(/[ÂĀÊĒÎĪÔŌṐÛŪâāêēîīôōûūf1-9\,\;\.\:\!\?\*\_\(\)]/)) return; // Translation line

    transliterationLines.push(line);
  });

  return transliterationLines.join("\n");
};