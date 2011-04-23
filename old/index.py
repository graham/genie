import json
import os
import sys

def build_index_for_directory(path, recurse=False):
    path = os.path.abspath(path)
    files = os.listdir(path)
    files = map( lambda x: x + '/' if os.path.isdir(path + '/' + x) else x, files )

    if recurse:
        for i in files:
            if os.path.isdir(path + '/' + i):
                build_index_for_directory( path + '/' + i, recurse )

    index_file = open(path+'/_index.json', 'w')
    index_file.write(json.dumps(files))
    index_file.close()

if __name__ == '__main__':
    p = sys.argv[1]
    build_index_for_directory(p, recurse=True)
    
