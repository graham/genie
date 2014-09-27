#! /usr/bin/env python
from bottle import route, run, static_file
import os
import json
import buildit

@route('/genie.compiled.js')
def comp():
    return buildit.create_file()
 
@route('/:path#.+#')
def server_static(path):
    if path.endswith('/'):
        path = path.replace('..', '')
        return json.dumps(os.listdir(os.path.abspath(path)))
    else:
        return open(os.path.abspath(path)).read()
 
import sys
 
if len(sys.argv) > 1:
    port = int(sys.argv[1])
else:
    port = 4040
 
run(host='0.0.0.0', port=port)
