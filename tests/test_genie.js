window.DEBUG = true;

describe("Genie Templates", function() {
    var template = null;
    
    beforeEach(function() {
        template = new genie.Template('My name is [[v.name]].');
    });
    
    it("should be able to render correctly.", function() {
        expect(template.render({"name":"graham"})).toEqual("My name is graham.");
    });
    
    it("single if statements work.", function() {
        var myTemplate = new genie.Template("[% if v.question %]Yes[% end %]");
        expect(myTemplate.render({"question":true})).toEqual("Yes");
    });
    
    it("if statements and else work.", function() {
        var myTemplate = new genie.Template("[% if v.question %]Yes[% else %]No[% end %]");
        expect(myTemplate.render({"question":true})).toEqual("Yes");
        expect(myTemplate.render({"question":false})).toEqual("No");
    });
    
    it("elif statements and else work.", function() {
        var myTemplate = new genie.Template("[% if v.question %]Yes[% else if 1 %]Middle[% else %]No[% end %]");
        expect(myTemplate.render({"question":false})).toEqual("Middle");
    });
    
    it("exposed statements should be available without v.", function() {
        var myTemplate = new genie.Template('[^ expose ["name"] ^]My name is [[ name ]].[^ expose "word" ^]');
        expect(myTemplate.render({"name":"graham"})).toEqual("My name is graham.");
    });
    
    it("padding and parenthesis around conditions should not break.", function() {
        var template = new genie.Template("one [[v.value]] three");
        expect(template.render({"value":"two"})).toEqual("one two three");

        template = new genie.Template("one [[ v.value ]] three");
        expect(template.render({"value":"two"})).toEqual("one two three");

        template = new genie.Template("one [% if v.value %]two[% end %] three");
        expect(template.render({"value":true})).toEqual("one two three");

        template = new genie.Template("one [%if v.value%]two[%end%] three");
        expect(template.render({"value":true})).toEqual("one two three");

        template = new genie.Template("one [%if v.value)%]two[%end%] three");
        expect(template.render({"value":true})).toEqual("one two three");

        template = new genie.Template("one [% (if v.value) %]two[%end%] three");
        expect(template.render({"value":true})).toEqual("one two three");

        template = new genie.Template("one [% ((if v.value) )%]two[%end%] three");
        expect(template.render({"value":true})).toEqual("one two three");

        template = new genie.Template("one [%((if v.value) ) %]two[%end%] three");
        expect(template.render({"value":true})).toEqual("one two three");
    });

    it("AutoExpose should work.", function() {
        var template = new genie.Template("[[ name ]]");
        expect(template.render({'name':'graham', '__auto_expose__':true})).toEqual('graham');
    });

    it("AutoExpose forces rerender to ensure it works.", function() {
        var template = new genie.Template("[[ name ]][% if v.test %][[ one ]][% end %]");
        expect(template.render({'name':'graham',
                                '__auto_expose__':true,
                                'test':false})).toEqual('graham');
        // Notice that 'one' is missing, so it shouldn't cause an exception on first run.

        expect(template.render({'name':'graham',
                                '__auto_expose__':true,
                                'test':true,
                                'one':'#1'
                                })).toEqual('graham#1');
        // This would fail if auto-expose doesn't re-render.
    });

    it("Using different open close chars should work.", function() {
        var env = new genie.Environment()
        env.begin = "<";
        env.end = ">";

        var t = env.create_template("test", "Hi, you've used << root.user.used >>");

        var result = t.render(
            {'__auto_expose__': true,
             'root':
             { 'user':
               {
                   used: "145.05 TB",
                   shared: "75.33 TB",
                   quota: "9,987 TB",
                   quota_percent: 0.50
               }
             }
            });
       expect(result).toEqual("Hi, you've used 145.05 TB")
    });

    it("Empty [] or <> or delimiteropen delimiterclosed shouldnt cause an issue.", function() {
        var env = new genie.Environment()
        env.begin = "<";
        env.end = ">";

        var t = env.create_template("test", "Hi, [] you've <> used << root.user.used >>");

        var result = t.render( {'__auto_expose__': true, 'root': {'user': {used: "145.05 TB"}}});
        expect(result).toEqual("Hi, [] you've <> used 145.05 TB")

        var env2 = new genie.Environment()
        env2.begin = "[";
        env2.end = "]";

        var t2 = env2.create_template("test", "Hi, [] you've <> used [[ root.user.used ]]");

        var result2 = t2.render( {'__auto_expose__': true, 'root': {'user': {used: "145.05 TB"}}});
        expect(result2).toEqual("Hi, [] you've <> used 145.05 TB")
        
    });

    it("Undefined specifiers dont break the parser.", function() {
        var env = new genie.Environment()

        var t = env.create_template("test", "Hi, [[ root.user.used ]] [$ cool $]");

        // $ doesn't mean anything to genie. so we shouldn't attempt to parse it.

        var result = t.render( {'__auto_expose__': true, 'root': {'user': {used: "145.05 TB"}}});
        expect(result).toEqual("Hi, 145.05 TB [$ cool $]")
    });

    it("should work with multiple render steps and different begin/end chars.", function() {
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

        expect(result).toEqual("10 20 [] <>");
    });
});
