// The following should run in a normal
var sys = require('sys');

require.paths.push('.');
var jsninja = require('jsninja');

function run_test() {
    var x = new jsninja.Template("This is a test {{ name }}.");
    var result = x.render( { name: "graham" } );
    sys.puts(result);
}

run_test();
