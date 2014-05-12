var last = [];

describe("Scheme Runtime", function() {
  beforeEach(function() {
  });
  
  // expect(env.parse("1 1 2.3 'hello world' true")).toEqual([1,1,2.3,'hello world',true]);
  
  it("Parse basic values correctly.", function() {
    var result = Scheme.parse('(alert "hi")');
    expect(result).toEqual([['alert', '"hi"']]);
  });

  it("Parse basic values nested.", function() {
    var result = Scheme.parse('(alert (+ 1 2 3))')
    expect(result).toEqual([['alert', ['+', '1', '2', '3']]]);

    var result = Scheme.parse('(alert (+ 1 2 3)) (alert 1 2 3)');
    expect(result).toEqual([
      ['alert', ['+', '1', '2', '3']],
      ['alert', '1', '2', '3']
    ]);
  });
  
  it("Parse a basic function correctly, including comments.", function() {
    var result = Scheme.parse([
      '(defun triple (X)',
      '"Compute three times X."  ; Inline comments can',
      '(* 3 X))                  ; be placed here.'
    ].join('\n'))
    expect(result).toEqual(
      [["defun", "triple", ["X"], 
        '"Compute three times X."', 
       ["*", "3", "X"]]]);
  });

  it("Parse example for command.", function() {
    var result = Scheme.parse('(par :selection "when i get home" (seq "one" "two" "three" :cursor))');
    expect(result).toEqual([
      ["par", ":selection", '"when i get home"',
       ["seq", '"one"', '"two"', '"three"', ":cursor"]]]);
    
  });

  it("basic attempt at eval with some addition.", function() {
    var scope = new Scheme.Scope();
    var result = Scheme.execute('(+ 1 2)', SchemeLib(), scope);
    expect(result).toEqual([3])
  });

  it("basic attempt at eval with some addition.", function() {
    var scope = new Scheme.Scope();
    var result = Scheme.execute('(+ 1 2)', SchemeLib(), scope);
    expect(result).toEqual([3])
  });

  it("basic attempt at eval with some big addition.", function() {
    var scope = new Scheme.Scope();
    var result = Scheme.execute('(+ 100 200)', SchemeLib(), scope);
    expect(result).toEqual([300])
  });
  
  it("attempt at scope with let", function() {
    var scope = new Scheme.Scope();
    var result = Scheme.execute('(let ((x 10)) (+ x x))', SchemeLib(), scope);
    expect(result).toEqual([20]);
  });

  it("attempt to set var in scope.", function() {
    var scope = new Scheme.Scope();
    scope.set('x', null);
    var result = Scheme.execute('(setf x 10)', SchemeLib(), scope);
    expect(scope.get('x')).toEqual(10);
  });

  it("fancy scope test.", function() {
    var scope = new Scheme.Scope();
    scope.set("X", null);
    var result = Scheme.execute('(let ((a 10)) (setf X (+ a a a a)))', SchemeLib(), scope);
    expect(scope.get('X')).toEqual(40);
  });

  it("fancy let nested.", function() {
    var scope = new Scheme.Scope();
    scope.set("result", null);
    var result = Scheme.execute("(let ((a 10)) (let ((b 20)) (setf result (+ a b))))", SchemeLib(), scope);
    expect(scope.get('result')).toEqual(30);
  });

  it("fancy let nested ret.", function() {
    var scope = new Scheme.Scope();
    var result = Scheme.execute("(let ((a 10)) (let ((b 20)) (+ a b)))", SchemeLib(), scope);
    expect(result).toEqual([30]);
  });

  it("custom func.", function() {
    var scope = new Scheme.Scope();
    scope.set('double', function(scope, args) {
      return args[0] * 2;
    });
    var code = "(double 2)";
    var result = Scheme.execute(code, SchemeLib(), scope);
    expect(result).toEqual([4]);
  });

  it("messy calls.", function() {
    var scope = new Scheme.Scope();
    scope.set('doit', function(scope, args) {
      scope.set('finished', true);
    });
    var code = "(doit)";
    var result = Scheme.execute(code, SchemeLib(), scope);
    expect(scope.get('finished')).toEqual(true);
  });

  it("work with scope.", function() {
    var scope = new Scheme.Scope();
    scope.set('x', 100);
    var result = scope.execute("(let ((y 500)) (+ x x y))");
    expect(result).toEqual([700]);
  });

  it("safe let.", function() {
    var scope = new Scheme.Scope();
    scope.set('x', 100);
    var result = scope.execute("(let ((x 1) (y 500)) (+ x x y))");
    expect(result).toEqual([502]);
    expect(scope.get('x')).toEqual(100);
  });

  it("safe let.", function() {
    var scope = new Scheme.Scope();
    scope.set('x', 100);
    var result = scope.execute("(let ((x 1) (y 500)) (+ x x y) (+ x y))");
    expect(result).toEqual([502]);
    expect(scope.get('x')).toEqual(100);
  });

});
  
