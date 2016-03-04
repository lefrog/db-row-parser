"use strict"
/*
Expect each row to be an array of simple value.

Can take a bunch of rows like:
[
    [1, "Pascal", "Lambert", "Fly Fishing"],
    [1, "Pascal", "Lambert", "X-Country Skiing"]
]

And turn them into an object like:
{
    "id": 1,
    "firstName": "Pascal",
    "lastName": "Lambert",
    "hobbies": ["Fly Fishing", "X-Country Skiing"]
}

Using a configuration like:

let hobbyParser = new DbRowParser({
    key: 3
});
let personParser = new DbRowParser({
    key: 0,
    properties: {
        "id": 0,
        "firstName": 1,
        "lastName": function(row) { return row[2].toString(); }, // definition of property can also be a simple transformation function.
        "hobbies": [hobbyParser]
    }
});

Basically when DbRowParser look at options.properties and see an object "{...}" it will dispatch row parsing to this class.
*/

const ArrayParser = function(options) {
    if (!(this instanceof ArrayParser)) {
        return new ArrayParser(options);
    }
    let a = this._splitCoreFromComplexProperties(options.properties);
    this._coreProps = a[0];
    this._complexProps = a[1];
}

module.exports = ArrayParser;

const DbRowParser = require("./DbRowParser"); // HACK: circular reference. Must be after module.exports.

ArrayParser.prototype.buildObject = function(row) {
    let obj = this._processCoreProperties(this._coreProps, row);
    this._processComplexProperties(obj, this._complexProps, row);

    return obj;
}

ArrayParser.prototype.buildChildObject = function(currentObj, row) {
    this._processComplexProperties(currentObj, this._complexProps, row);
}

ArrayParser.prototype._processCoreProperties = function(props, row) {
    let obj = {};

    for (var pName in props) {
        let i = props[pName];
        if ((typeof i) === "function") {
            obj[pName] = i(row);
        } else {
            obj[pName] = row[i];
        }
    }

    return obj;
}

ArrayParser.prototype._processComplexProperties = function(obj, props, row) {
    for (var pName in props) {
        let pDef = props[pName];
        let parser = pDef.parser;

        let v = parser.parse(row);

        if (pDef.many) {
            if (!obj[pName]) {
                obj[pName] = [];
            }
            obj[pName].push(v);
        } else {
            obj[pName] = v;
        }
    }
}

ArrayParser.prototype._splitCoreFromComplexProperties = function(propertyDef) {
    let coreProps = {};
    let complexProps = {};

    for (let pName in propertyDef) {
        let i = propertyDef[pName];

        if (Array.isArray(i)) {
            let parser = i[0];
            DbRowParser.assertIsParser(pName, parser);
            let pDef = {
                parser: parser,
                many: true
            }
            complexProps[pName] = pDef;
        } else if ((typeof i) === "object") {
            let parser = i;
            DbRowParser.assertIsParser(pName, parser);
            let pDef = {
                parser: parser,
                many: false
            }
            complexProps[pName] = pDef;
        } else {
            coreProps[pName] = i;
        }
    }

    return [coreProps, complexProps];
}
