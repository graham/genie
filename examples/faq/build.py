#! /usr/bin/env python

import sys
import os
import re

try:
    import json
except:
    import simplejson as json

def find_file(root='.', filetypes=[], max_depth=-1, _depth=0, dirs=0, hidden=1):
    files = []
    if os.path.isfile(root):
        return [root]
    for i in os.listdir(root):
        if i.startswith('.') and not hidden:
            pass
        elif os.path.isdir(root + os.path.sep + i):
            if max_depth == -1 or (_depth <= max_depth):
                tmp = root + os.path.sep + i
                files = files + find_file(tmp, filetypes, _depth=_depth+1, max_depth=max_depth, hidden=hidden)
            else:
                return []
            if dirs:
                fffff = root + os.path.sep + i + os.path.sep
                files.append(fffff.replace('//', '/'))
        else:
            if filetypes != []:
                for filetype in filetypes:
                    if re.match(filetype, i):
                        fffff = root + os.path.sep + i
                        files.append(fffff.replace('//', '/'))
            else:
                files.append(root + os.path.sep + i)
    return files

html_files = find_file('articles/', filetypes=['(.*)\.html'])
templates = find_file('templates/', filetypes=['(.*)\.html'])

f = open('data.txt', 'w')
f.write( json.dumps({'html_files':html_files, 'templates':templates}) )
f.close()

print 'Done, wrote %i articles and %i templates names to the data.' % (len(html_files), len(templates))
