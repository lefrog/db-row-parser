"use strict"

const through = require('through2');
const DbRowParser = require("./DbRowParser");
const DbRowParserStream = require("./DbRowParserStream");

let parser = new DbRowParser({
    key: 0,
    properties: {
        id: 0,
        name: 1
    }
});

let stream = new DbRowParserStream({
    rowParser: parser
});

let t = through.obj(
    function(obj, encoding, cb) {
        this.push(JSON.stringify(obj) + "\n");
        cb();
    });

stream
    .pipe(t)
    .pipe(process.stdout);

stream.write([1, "Pascal"]);
stream.write([2, "Patricia"]);
stream.write([3, "Mackenzie"]);
stream.end(null);
