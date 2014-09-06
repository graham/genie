#! /usr/bin/env python

s = open('src/subclass.js').read()
g = open('src/genie.js').read()
c = open('src/component.js').read()

start = '''
var geniemvc = (function() {
    var module = {};
    module.exports = {};

'''

end = '''
    return module.exports;
})();
'''

f = open('compiled_genie.js', 'w')
for i in (start, s, g, c, end):
    f.write(i)
    f.write('\n')

f.close()
