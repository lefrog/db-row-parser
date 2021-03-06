"use strict"

const assert = require('assert');

const DbRowParser = require("../DbRowParser");

describe("DbRowParser - Array like rows", function() {
    describe("#parseRow single object", function() {
        let objectCounter = 0;
        let result = null;
        let row = [1, "foo@example.com", 10, "This would be a blog post"];
        let authorParser;

        before(function() {
            authorParser = new DbRowParser({
                key: 0,
                properties: {
                    "authorId": 0,
                    "name": 1
                }
            });

            authorParser.on("new-object", function(obj) {
                objectCounter++;
                result = obj;
            });

            authorParser.parse(row);
            authorParser.end();
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

    describe("#constructor with invalid child configuration", function() {
        it("should throw an exception", function() {
            assert.throws(() => {
                new DbRowParser({
                    properties: {
                        name: 1,
                        bad: {}
                    }
                })
            }, /bad.*object/i);
        });
    });

    describe("#parseRow with property as function", function() {
        let row;
        before(function() {
            let parser = new DbRowParser({
                properties: {
                    foo: function(arr) {
                        return "Hi " + arr[0];
                    }
                }
            });

            row = parser.parse(["Foo"]);
        });

        it("should transform property", function() {
            assert.equal(row.foo, "Hi Foo");
        });
    });

    describe("#parseRow with single value child parser", function() {
        let result;
        before(function(done) {
            let colorParser = new DbRowParser({
                key: 1
            });
            let parser = new DbRowParser({
                key: 0,
                properties: {
                    id: 0,
                    favoriteColors: [colorParser]
                }
            });

            parser.on("new-object", function(obj) {
                result = obj;
                done();
            });

            parser.parse([1, "Blue"]);
            parser.parse([1, "Green"]);
            parser.end();
        });

        it("should have my 2 favorite colors", function() {
            assert.ok(Array.isArray(result.favoriteColors));
            assert.equal(result.favoriteColors.length, 2);
            assert.equal(result.favoriteColors[0], "Blue");
            assert.equal(result.favoriteColors[1], "Green");
        });
    });

    describe("#parseRow 1 author 1 blog", function() {
        let row = [1, "foo@example.com", 10, "This would be a blog post"];
        var authorParser, blogParser;
        let result = null;

        before(function() {
            blogParser = new DbRowParser({
                key: 2,
                properties: {
                    "blogId": 2,
                    "text": 3
                }
            });

            authorParser = new DbRowParser({
                key: 0,
                properties: {
                    "authorId": 0,
                    "name": 1,
                    "blogs": [blogParser]
                }
            });

            result = authorParser.parse(row);
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
                key: 2,
                properties: {
                    "blogId": 2,
                    "text": 3
                }
            });

            authorParser = new DbRowParser({
                key: 0,
                properties: {
                    "authorId": 0,
                    "name": 1,
                    "blogs": [blogParser]
                }
            });

            authorParser.on("new-object", function(author) {
                result = author;
                done();
            });
            authorParser.parse(row1);
            authorParser.parse(row2);
            authorParser.end();
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
                key: 2,
                properties: {
                    "blogId": 2,
                    "text": 3
                }
            });

            authorParser = new DbRowParser({
                key: 0,
                properties: {
                    "authorId": 0,
                    "name": 1,
                    "blogs": [blogParser]
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
                authorParser.parse(row);
            });
            authorParser.end();
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
                key: 4,
                properties: {
                    "id": 4,
                    "street": 5
                }
            });

            blogParser = new DbRowParser({
                key: 2,
                properties: {
                    "blogId": 2,
                    "text": 3
                }
            });

            authorParser = new DbRowParser({
                key: 0,
                properties: {
                    "authorId": 0,
                    "name": 1,
                    "blogs": [blogParser],
                    "address": addressParser
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
                authorParser.parse(row);
            });
            authorParser.end();
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
            assert.equal(author1.blogs.length, 2);
            assert.equal(author1.blogs[0].blogId, 10);
            assert.equal(author1.blogs[1].blogId, 11);
        });
        it("should have mapped author2", function() {
            assert.equal(author2.authorId, 2);
            assert.equal(author2.name, "bar@example.com");
            assert.ok(Array.isArray(author2.blogs));
        });
        it("should have mapped author2 blogs", function() {
            assert.equal(author2.blogs.length, 1);
            assert.equal(author2.blogs[0].blogId, 20);
        });
    });

    describe("when re-use parser on same set of rows", function() {
        let rows = [
            [1, "Parent 1", 10, "Child 10"],
            [1, "Parent 1", 20, "Child 20"]
        ];

        let childParser = new DbRowParser({
            key: 2,
            properties: {
                id: 2,
                name: 3
            }
        });

        let parentParser = new DbRowParser({
            key: 0,
            properties: {
                id: 0,
                name: 1,
                children: [childParser]
            }
        });

        let newObject;
        parentParser.on("new-object", obj => {
            newObject = obj;
        });

        it("should parser ok the first time", function() {
            rows.forEach(row => {
                parentParser.parse(row);
            });
            parentParser.done();

            assert.equal(1, newObject.id);
            assert.equal("Parent 1", newObject.name);
            assert.equal(2, newObject.children.length);
            assert.equal(10, newObject.children[0].id);
            assert.equal("Child 10", newObject.children[0].name);
            assert.equal(20, newObject.children[1].id);
            assert.equal("Child 20", newObject.children[1].name);
        });

        it("should parser ok the second time", function() {
            rows.forEach(row => {
                parentParser.parse(row);
            });
            parentParser.done();

            assert.equal(1, newObject.id);
            assert.equal("Parent 1", newObject.name);
            assert.equal(2, newObject.children.length);
            assert.equal(10, newObject.children[0].id);
            assert.equal("Child 10", newObject.children[0].name);
            assert.equal(20, newObject.children[1].id);
            assert.equal("Child 20", newObject.children[1].name);
        });
    });
});

describe("DbRowParser - Object like rows", function() {
    describe("#parseRow 1 parent 1 child", function() {
        let result = null;

        before(function(done) {
            let addressParser = new DbRowParser({
                key: "street",
                properties: ["street", "city"]
            });
            let authorParser = new DbRowParser({
                key: "authorId",
                properties: ["authorId", "name", {
                    dob: function(row) {
                        return new Date(row.dob).toString();
                    }
                }, {
                    address: addressParser
                }]
            });

            authorParser.on("new-object", (obj) => {
                result = obj;
                done();
            });

            let row = {
                authorId: 1,
                name: "Pascal",
                dob: 12345,
                street: "123 on the street",
                city: "in a nice city"
            };

            authorParser.parse(row);
            authorParser.end();
        });
        it("should have mapped properly the row", function() {
            assert.equal(result.authorId, 1);
            assert.equal(result.name, "Pascal");
            assert.equal(result.dob, "Wed Dec 31 1969 17:00:12 GMT-0700 (MST)");
            assert.equal(result.address.street, "123 on the street");
            assert.equal(result.address.city, "in a nice city");
        });
    });
});
