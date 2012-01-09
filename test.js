var genie_tests = ( function() {
    var TestSuite = function(note) {
        this.note = note;
        this.passes = Array();
        this.fails = Array();
    };

    TestSuite.prototype.assertEqual = function(val1, val2, add_note) {
        if (val1 == val2) {
            this.passes.push(add_note);
        } else {
            this.fails.push( [add_note, '!=', val1, val2]);
        }
    };

    TestSuite.prototype.assertNotEqual = function(val1, val2, add_note) {
        if (val1 != val2) {
            this.passes.push(add_note);
        } else {
            this.fails.push( [add_note, '==', val1, val2]);
        }
    };

    var run_tests = function() {
        var suite = new TestSuite('tests!');
        var Template = genie.Template;

        // start writing tests here

        var t = new Template("My name is <<name>>");
        suite.assertEqual( t.render({'name':'Genie'}), "My name is Genie", "basic genie render" );
        suite.assertEqual( t.render({'name':'asdf'}),  "My name is asdf", "basic genie render 2" );

        var t2 = new Template("<% if true %>Test<% end %>asdf");
        suite.assertEqual( t2.render({}), "Testasdf", "condition test 1" );
    
        var t3 = new Template("        <% if true %>Test   <% end %>");
        suite.assertEqual( t3.render({}), "Test", "condition test" );

        var t4 = new Template("this is a test<! bailout(); !>");
        suite.assertEqual( t4.render({}), null, "Bailout Test");

        // finish writing tests here

        return [suite.passes, suite.fails];
    };

    var run_tests_simple = function() {
        results = run_tests();
        if (results[1].length) {
            return false;
        }
        return true;
    };

    var run_tests_debug = function() {
        results = run_tests();
        for(var i=0; i < results[0].length; i++) {
            console.log( 'PASS: ' + results[0][i] );
        }
        for(var i=0; i < results[1].length; i++) {
            var o = results[1][i];
            console.log(o);
            console.log( 'FAIL: (' + o[0] + ') -> ' + JSON.stringify(o[2]) + ' ' + o[1] + ' ' + JSON.stringify(o[3]) );
        }
    };

    return {'TestSuite':TestSuite,
            'run_tests':run_tests,
            'run_tests_debug':run_tests_debug,
            'test':run_tests_debug
            };
})()