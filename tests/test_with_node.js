var window = {};
var DEBUG = true;
window.DEBUG = true;

var genie = require('../src/genie');
var pairs = [ ['[', ']'], ['<', '>'] ];

var template = "[% if true %][[value1]] <<value2>>[% end %] [] <>";

for (var i in pairs) {
    var pair = pairs[i];
    var env = new genie.Environment();
    env.begin = pair[0];
    env.end = pair[1];
    var t = env.create_template("test", template);
    var result = t.render({'__auto_expose__': true, 'value1': 10, 'value2': 20})
    template = result;
}

console.log(result);
