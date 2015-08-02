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
});
