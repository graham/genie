var TimeUtil = (function() {
  var simple_duration_parse = function(words) {
    var d = [].concat(['sec', 'secs', 'second', 'seconds'])
         .concat(['min', 'mins', 'minute', 'minutes'])
         .concat(['hour', 'hours'])
         .concat(['day', 'days'])
         .concat(['week', 'weeks'])
         .concat(['month', 'months'])
         .concat(['year', 'years']);

    var matcher = new RegExp("(\\d+\.?(\\d+)?) ?(" + d.join('|') + "|[smhdwmy])$");
    var result = matcher.exec(words);

    if (result) {
      return result[0];
    } else {
      return null;
    }

  };

  return {parse:simple_duration_parse};
})();
