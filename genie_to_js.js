var window = {};
var DEBUG = true;
window.DEBUG = true;

var genie = require('./src/genie');
var template = [];

process.stdin.resume();
process.stdin.on('data', function(buf) { template.push(buf.toString()); });
process.stdin.on('end', function() {
    var fullTemplate = template.join('\n');
    var env = new genie.Environment();
    var t = env.create_template("test", fullTemplate);
    var result = t.generated_code_as_string({'__auto_expose__': true});
    console.log(result);
});
