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

        template = new genie.Template("one [%(if v.value)%]two[%end%] three");
        expect(template.render({"value":true})).toEqual("one two three");

        template = new genie.Template("one [% (if v.value) %]two[%end%] three");
        expect(template.render({"value":true})).toEqual("one two three");

        template = new genie.Template("one [% ((if v.value) )%]two[%end%] three");
        expect(template.render({"value":true})).toEqual("one two three");

        template = new genie.Template("one [%((if v.value) ) %]two[%end%] three");
        expect(template.render({"value":true})).toEqual("one two three");
    });
    
});
