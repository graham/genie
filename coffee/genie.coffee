util = require 'util'

GENIE_VERSION = "0.2"
GENIE_CONTEXT_begin = "["
GENIE_CONTEXT_end = "]"

bc_comment = 0
bc_condition = 1
bc_exec = 1 << 1
bc_bindable = 1 << 2
bc_notes = 1 << 3
bc_compiler = 1 << 4
bc_variable = 1 << 5

GENIE_CONTEXT_lookup =
        "#": bc_comment
        "%": bc_condition
        "!": bc_exec
        "&": bc_bindable
        "^": bc_notes
        "~": bc_compiler

GENIE_CONTEXT_lookup[GENIE_CONTEXT_begin] = bc_variable
GENIE_CONTEXT_lookup[GENIE_CONTEXT_end] = bc_variable

str_trim = (s) -> s.replace /^[\n|\r|\s]+|[\n|\r|\s]+$/g, ""
str_trimr = (s) -> s.replace /\s+$/g, ""




