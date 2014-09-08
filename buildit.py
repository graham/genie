#! /usr/bin/env python

import os

#s = open('src/subclass.js').read()
#c = open('src/component.js').read()

s = ''
g = open('src/genie.js').read()
c = ''

start = '''
var geniemvc = (function() {
    var module = {};
    module.exports = {};

'''

end = '''
    return module.exports;
})();
'''

try:
    os.mkdir('build')
except:
    pass

f = open('build/genie.compiled.js', 'w')
for i in (start, s, g, c, end):
    f.write(i)
    f.write('\n')

f.close()

os.system('cat build/genie.compiled.js | jsmin > build/genie.min.js')
