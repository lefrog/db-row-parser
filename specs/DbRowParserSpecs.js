"use strict"

const assert = require('assert');

const DbRowParser = require("../DbRowParser");

let sut = null;

describe("DbRowParser", function() {
    describe("#parseRow single object", function() {
        let objectCounter = 0;
        let result = null;
        let row = [1, "foo@example.com", 10, "This would be a blog post"];

        before(function() {
            sut = new DbRowParser({
                keyIndice: 0,
                properties: {
                    "authorId": 0,
                    "name": 1
                }
            });

            sut.on("new-object", function(obj) {
                objectCounter++;
                result = obj;
            });

            sut.parseRow(row);
        });
        it("should emit 1 object", function(done) {
            assert.equal(objectCounter, 1);
            done();
        });
        it("should have mapped properly the row", function(done) {
            assert.equal(result.authorId, 1);
            assert.equal(result.name, "foo@example.com");
            done();
        });
    });

    describe("#parseRow 2 object", function() {
        let row = [1, "foo@example.com", 10, "This would be a blog post"];
        var authorParser, blogParser;
        let result = null;

        before(function() {
            blogParser = new DbRowParser({
                keyIndice: 2,
                properties: {
                    "blogId": 2,
                    "text": 3
                }
            });

            authorParser = new DbRowParser({
                keyIndice: 0,
                properties: {
                    "authorId": 0,
                    "name": 1,
                    "blogs": {
                        parser: blogParser,
                        many: true
                    }
                }
            });

            result = authorParser.parseRow(row);
        });
        it("should have mapped author", function() {
            assert.equal(result.authorId, 1);
            assert.equal(result.name, "foo@example.com");
            assert.ok(Array.isArray(result.blogs));
        });
        it("should have mapped blog", function() {
            let blog = result.blogs[0];
            assert.equal(blog.blogId, 10);
            assert.equal(blog.text, "This would be a blog post");
        });
    })

});
