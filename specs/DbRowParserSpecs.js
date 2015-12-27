"use strict"

const assert = require('assert');

const DbRowParser = require("../DbRowParser");

describe("DbRowParser", function() {
    describe("#parseRow single object", function() {
        let objectCounter = 0;
        let result = null;
        let row = [1, "foo@example.com", 10, "This would be a blog post"];
        let authorParser;

        before(function() {
            authorParser = new DbRowParser({
                keyIndice: 0,
                properties: {
                    "authorId": 0,
                    "name": 1
                }
            });

            authorParser.on("new-object", function(obj) {
                objectCounter++;
                result = obj;
            });

            authorParser.parseRow(row);
            authorParser.done();
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

    describe("#parseRow 1 author 1 blog", function() {
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
    });

    describe("#parseRow 1 author 2 blog posts", function() {
        let row1 = [1, "foo@example.com", 10, "This would be a blog post"];
        let row2 = [1, "foo@example.com", 20, "This is a second blob post"];
        let authorParser, blogParser;
        let result = null;

        before(function(done) {
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

            authorParser.on("new-object", function(author) {
                result = author;
                done();
            });
            authorParser.parseRow(row1);
            authorParser.parseRow(row2);
            authorParser.done();
        });
        it("should have mapped author", function() {
            assert.equal(result.authorId, 1);
            assert.equal(result.name, "foo@example.com");
            assert.ok(Array.isArray(result.blogs));
        });
        it("should have mapped 1st blog", function() {
            let blog = result.blogs[0];
            assert.equal(blog.blogId, 10);
            assert.equal(blog.text, "This would be a blog post");
        });
        it("should have mapped 2nd blog", function() {
            let blog = result.blogs[1];
            assert.equal(blog.blogId, 20);
            assert.equal(blog.text, "This is a second blob post");
        });
    });

    describe("#parseRow 2 author 2 blog posts", function() {
        let rows = [
            [1, "foo@example.com", 10, "This would be a blog post"],
            [1, "foo@example.com", 11, "This is a second blob post"],
            [2, "bar@example.com", 20, "Second author, first blog"]
        ];
        let authorParser, blogParser;
        let author1 = null;
        let author2 = null;

        before(function(done) {
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

            authorParser.on("new-object", function(author) {
                if (author1 == null) {
                    author1 = author;
                } else if (author2 == null) {
                    author2 = author;
                    done();
                }
            });

            rows.forEach(row => {
                authorParser.parseRow(row);
            });
            authorParser.done();
        });

        it("should have mapped author1", function() {
            assert.equal(author1.authorId, 1);
            assert.equal(author1.name, "foo@example.com");
            assert.ok(Array.isArray(author1.blogs));
        });
        it("should have mapped author1 1st blog", function() {
            let blog = author1.blogs[0];
            assert.equal(blog.blogId, 10);
            assert.equal(blog.text, "This would be a blog post");
        });
        it("should have mapped author1 2nd blog", function() {
            let blog = author1.blogs[1];
            assert.equal(blog.blogId, 11);
            assert.equal(blog.text, "This is a second blob post");
        });
        it("should have mapped author2", function() {
            assert.equal(author2.authorId, 2);
            assert.equal(author2.name, "bar@example.com");
            assert.ok(Array.isArray(author2.blogs));
        });
        it("should have mapped author2 1st blog", function() {
            let blog = author2.blogs[0];
            assert.equal(blog.blogId, 20);
            assert.equal(blog.text, "Second author, first blog");
        });
    });

    describe("#parseRow 2 author 2 blog posts, first author has address", function() {
        let rows = [
            [1, "foo@example.com", 10, "This would be a blog post", "addr_id", "123 on the street"],
            [1, "foo@example.com", 11, "This is a second blob post", "addr_id", "123 on the street"],
            [2, "bar@example.com", 20, "Second author, first blog"]
        ];
        let authorParser, blogParser, addressParser;
        let author1 = null;
        let author2 = null;

        before(function(done) {
            addressParser = new DbRowParser({
                keyIndice: 4,
                properties: {
                    "id": 4,
                    "street": 5
                }
            });

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
                    },
                    "address": {
                        parser: addressParser
                    }
                }
            });

            authorParser.on("new-object", function(author) {
                if (author1 == null) {
                    author1 = author;
                } else if (author2 == null) {
                    author2 = author;
                    done();
                }
            });

            rows.forEach(row => {
                authorParser.parseRow(row);
            });
            authorParser.done();
        });

        it("should have mapped author1", function() {
            assert.equal(author1.authorId, 1);
            assert.equal(author1.name, "foo@example.com");
            assert.ok(Array.isArray(author1.blogs));
        });
        it("should have mapped author1 address", function() {
            assert.equal(author1.address.id, "addr_id");
            assert.equal(author1.address.street, "123 on the street");
        });
        it("should have mapped author1 blogs", function() {
            assert.equal(author1.blogs[0].blogId, 10);
            assert.equal(author1.blogs[1].blogId, 11);
        })
        it("should have mapped author2", function() {
            assert.equal(author2.authorId, 2);
            assert.equal(author2.name, "bar@example.com");
            assert.ok(Array.isArray(author2.blogs));
        });
    });
});
