"use strict"

/*
Expect each row to be a "flat" Javascript Object.

Can take a bunch of rows like:
[
{
    "id": 1,
    "firstName": "Pascal",
    "lastName": "Lambert",
    "dob": 123456,
    "hobby": "Fly Fishing"
},
{
    "id": 1,
    "firstName": "Pascal",
    "lastName": "Lambert",
    "dob": 123456,
    "hobby": "X-Country Skiing"
}
]

And turn them into an object like:
{
    "id": 1,
    "firstName": "Pascal",
    "lastName": "Lambert",
    "dob": "Wed Dec 31 1969 17:00:12 GMT-0700 (MST)",
    "hobbies": ["Fly Fishing", "X-Country Skiing"]
}

Using a configuration like:

let hobbyParser = new DbRowParser({
    key: "hobby"
});
let personParser = new DbRowParser({
    key: "id",
    properties: [
        "id", "firstName", "lastName",
        {
            dob: function(row) { return new Date(row.dob).toString(); }
        },
        {
            hobbies: [hobbyParser]
        },

    ]
});

Basically when DbRowParser look at options.properties and see an array "[...]" it will dispatch row parsing to this class.
*/
const ObjectParser = function(options) {
    if (!(this instanceof ObjectParser)) {
        return new ObjectParser(options);
    }
    let a = this._splitCoreFromComplexProperties(options.properties);
    this._coreProps = a[0];
    this._funcProps = a[1]
    this._complexProps = a[2];
}

module.exports = ObjectParser;

const DbRowParser = require("./DbRowParser"); // HACK: circular reference. Must be after module.exports.

ObjectParser.prototype.buildObject = function(row) {
    let obj = this._processCoreProperties(this._coreProps, row);
    this._processFunctionsProperties(obj, this._funcProps, row);
    this._processComplexProperties(obj, this._complexProps, row);

    return obj;
}

ObjectParser.prototype.buildChildObject = function(currentObj, row) {
    this._processComplexProperties(currentObj, this._complexProps, row);
}

ObjectParser.prototype._processCoreProperties = function(props, row) {
    let obj = {};
    props.forEach(p => {
        obj[p] = row[p];
    });
    return obj;
}

ObjectParser.prototype._processFunctionsProperties = function(obj, props, row) {
    props.forEach(fDef => {
        obj[fDef.name] = fDef.func(row);
    });
}

ObjectParser.prototype._processComplexProperties = function(obj, props, row) {
    props.forEach(pDef => {
        let v = pDef.parser.parse(row);

        if (pDef.many) {
            if (!obj[pDef.name]) {
                obj[pDef.name] = [];
            }
            obj[pDef.name].push(v);
        } else {
            obj[pDef.name] = v;
        }
    });
}

ObjectParser.prototype._splitCoreFromComplexProperties = function(propertyDef) {
    let coreProps = [];
    let funcProps = [];
    let complexProps = [];

    propertyDef.forEach((p) => {
        if ((typeof p) == "object") {
            let pName = Object.keys(p)[0];
            let def = p[pName];
            if ((typeof def) == "function") {
                let pDef = {
                    name: pName,
                    func: def
                }
                funcProps.push(pDef);
            } else {
                let parser;
                let many;
                if (Array.isArray(def)) {
                    many = true;
                    parser = def[0];
                } else {
                    many = false;
                    parser = def;
                }
                DbRowParser.assertIsParser(pName, parser);
                let pDef = {
                    name: pName,
                    parser: parser,
                    many: many
                }
                complexProps.push(pDef);
            }
        } else {
            coreProps.push(p);
        }
    });

    return [coreProps, funcProps, complexProps];
}
