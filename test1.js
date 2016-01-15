"use strict"

const through = require('through2');
const DbRowParser = require("./DbRowParser");
const DbRowParserStream = require("./DbRowParserStream");

let hobby = new DbRowParser({
    key: "hobbyId",
    properties: ["hobbyId", "hobbyName"]
});
let person = new DbRowParser({
    key: "id",
    properties: ["id", "name", {
        hobbies: [hobby]
    }]
});

let stream = new DbRowParserStream({
    rowParser: person
});

let t = through.obj(
    function(obj, encoding, cb) {
        this.push(JSON.stringify(obj) + "\n");
        cb();
    });

stream
    .pipe(t)
    .pipe(process.stdout);

let data = [{
    id: 1,
    name: "Pascal",
    hobbyId: 10,
    hobbyName: "Fly Fishing"
}, {
    id: 1,
    name: "Pascal",
    hobbyId: 11,
    hobbyName: "Cross Country Skiing"
}, {
    id: 2,
    name: "Patricia",
    hobbyId: 20,
    hobbyName: "Movie"
}, {
    id: 2,
    name: "Patricia",
    hobbyId: 21,
    hobbyName: "Puzzle"
}, {
    id: 3,
    name: "Mackenzie",
    hobbyId: 30,
    hobbyName: "Reading"
}];

data.forEach((d) => {
    stream.write(d);
});
stream.end(null);
