// The following should run in a normal
var sys = require('sys');

require.paths.push('.');
var jsninja = require('jsninja');

function run_test() {
    var x = new jsninja.Template("This is a test {{ name }}. {% for i in [1,2,3] %}{@ slurp @}\n{{ i }}\n{@ slurp @}\n\n\n\n\n{% end %}");
    x.environment = new jsninja.Environment();
    var result = x.render( { name: "graham" } );
    sys.puts(result);
}

run_test();
