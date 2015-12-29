"use strict"

const assert = require('assert');
const through = require('through2');
const DbRowParser = require("../DbRowParser");

const DbRowParserStream = require("../DbRowParserStream");

describe("DbRowParserStream", function() {
    let result = [];

    before(function(done) {
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

        stream.pipe(through.obj(
            function(obj, encoding, cb) {
                result.push(obj);
                cb();
            },
            function(cb) {
                done();
                cb();
            }));

        stream.write([1, "Pascal"]);
        stream.write([2, "Patricia"]);
        stream.write([3, "Mackenzie"]);
        stream.end(null);
    });
    it("should have received 3 object", function() {
        assert.equal(result.length, 3);
        assert.equal(result[0].id, 1);
        assert.equal(result[1].id, 2);
        assert.equal(result[2].id, 3);
    });
});
