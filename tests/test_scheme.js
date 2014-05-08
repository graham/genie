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
});
  
