#! /usr/bin/env python

import os

def create_file():
    s = open('src/subclass.js').read()
    c = open('src/component.js').read()
    g = open('src/genie.js').read()
    r = open('src/route.js').read()

    start = '''
var genie = (function() {
var genie_module = {};
genie_module.exports = {};
    
'''

    end = '''
    return genie_module.exports;
})();
'''


    content = []


    for i in (start, s, g, c, r, end):
        content.append(i)
        content.append('\n')

    return content


if __name__ == '__main__':
    try:
        os.mkdir('build')
    except:
        pass

    f = open('build/genie.compiled.js', 'w')
    f.write('\n'.join(create_file()))
    f.close()

    os.system('cat build/genie.compiled.js | jsmin > build/genie.min.js')

    print '\tcreated build/genie.compiled.js...'
    print '\tcreated build/genie.min.js...'
    print ''
