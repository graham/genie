from bottle import route, run, request, static_file, response
import json, io, traceback, os

DEBUG=True

## Utility functions

def steal_stack_trace():
    safe_stderr = sys.stderr
    s = io.StringIO()
    try:
        sys.stderr = s
        traceback.print_exc()
    finally:
        sys.stderr = safe_stderr
    return s.getvalue()

def jafar_ok(data):
    return json.dumps([1, data])

def jafar_error(data, trace=None):
    if DEBUG:
        return json.dumps([0, data, trace])
    else:
        return json.dumps([0, data, None])

## Temp Functions
def get_num():
    if not os.path.exists('data.txt'):
        return 0

    try:
        return int(open('data.txt').read())
    except:
        return 0

def write_num(num):
    f = open('data.txt', 'w')
    f.write(str(num))
    f.close()

## end.        

@route('/_api')
def apilist():
    return open('example.json').read()

@route('/')
def index():
    return open('index.html').read()

@route('/jafar.js')
def thelib():
    response.content_type = "text/javascript"
    return open('jafar.js').read()

@route('/asdf', method="POST")
def asdf():
    return jafar_ok(list(range(0, 10)))

@route('/incr', method="POST")
def incr():
    disk_value = get_num()
    try:
        num = int(request.forms.get("num") or 1)
        new_num = disk_value + num
        write_num(new_num)
        return jafar_ok(new_num)
    except:
        trace = steal_stack_trace()
        return jafar_error(disk_value, trace)

@route('/decr', method="POST")
def decr():
    disk_value = get_num()
    try:
        num = int(request.forms.get("num") or 1)
        new_num = disk_value - num
        write_num(new_num)
        return jafar_ok(new_num)
    except:
        trace = steal_stack_trace()
        return jafar_error(disk_value, trace)

@route('/get')
def get():
    return jafar_ok(get_num())

run(host='localhost', port=8080, reload=True)
