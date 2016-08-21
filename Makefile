all:
    tsc -p tsconfig.json

clean:
    rm dist/*

dev:
    tsc -p tsconfig.json --watch
