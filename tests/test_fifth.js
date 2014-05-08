describe("Fifth Runtime", function() {
        beforeEach(function() {
            });
        
        it("Parse basic values correctly.", function() {
                var env = new Fifth.Environment();
                expect(env.parse("1 1 2.3 'hello world' true")).toEqual([1,1,2.3,'hello world',true]);
                expect(env.parse('"123" true false 3.1')).toEqual(["123", true, false, 3.1]);
            });

        it("parse basic function calls.", function() {
                var env = new Fifth.Environment();
                expect(env.parse("1 1 +")).toEqual([1, 1, env.functions['+']]);
            });

        it("execute basic function calls.", function() {
                var env = new Fifth.Environment();
                expect(env.stack).toEqual([]); // make sure the stack is empty.
                env.execute("1 1 +"); // stack should be [2]
                expect(env.stack).toEqual([2]);
            });

        it("store vars.", function() {
                var env = new Fifth.Environment();
                env.execute("1 2 3");
                env.execute("!a");
                expect(env.vars['a']).toEqual(3);
                expect(env.stack).toEqual([1,2]);
                
                env.execute("+ !b");
                expect(env.vars['b']).toEqual(3);
            });

        it("load vars.", function() {
                var env = new Fifth.Environment();
                env.execute("1 2 3 + +");
                expect(env.peek()).toEqual(6);

                env.execute("!a");
                expect(env.peek()).toEqual(null);

                env.execute("@a");
                expect(env.peek()).toEqual(6);
            });

        it("Should emulate a complex call.", function() {
                var env = new Fifth.Environment();
                env.register("publish", function(e) {
                        var target = e.stack.pop();
                        var message = e.stack.pop();
                        e.stack.push([1,2,3]);
                    });
                env.execute('"custom message" "event_123" publish');
                expect(env.peek()).toEqual([1,2,3]);
            });

        it("Should properly handle quoting in order to allow for map", function() {
                var env = new Fifth.Environment();
                env.execute("[1,2,3,4,5] `1 +` map");
                expect(env.peek()).toEqual([2,3,4,5,6]);
            });

        it("Should properly handle quoting in order to allow for map (double)", function() {
                var env = new Fifth.Environment();
                env.execute("[1,2,3,4,5] `2 *` map");
                expect(env.peek()).toEqual([2,4,6,8,10]);
            });

        it("Should have foldl.", function() {
                var env = new Fifth.Environment();
                env.execute("[1,2,3,9] 1 `+` foldl");
                expect(env.peek()).toEqual(16);
            });
    });
