"use strict"

const util = require('util');
const events = require('events');

const DbRowParser = function(options) {
    if (!(this instanceof DbRowParser)) {
        return new DbRowParser(options);
    }

    events.EventEmitter.call(this);

    this._keyIndice = options.keyIndice;
    let a = this._splitCoreFromComplexProperties(options.properties);
    this._coreProps = a[0];
    this._complexProps = a[1];

    this._previousKey = null;
    this._currentObj = null;

    this._subParser
}

util.inherits(DbRowParser, events.EventEmitter);

module.exports = DbRowParser;

DbRowParser.prototype.parseRow = function(row) {
    let key = row[this._keyIndice];

    if (key === this._previousKey) {
        this._buildChildObject(row);
        return;
    }

    if (key == null) {
        return;
    }

    this._previousKey = key;

    this._currentObj = this._buildObject(row);
    this.emit("new-object", this._currentObj);

    return this._currentObj;
}

DbRowParser.prototype._buildObject = function(row) {
    let obj = this._processCoreProperties(this._coreProps, row);
    this._processComplexProperties(obj, this._complexProps, row);

    return obj;
}

DbRowParser.prototype._processCoreProperties = function(props, row) {
    let obj = {};

    for (var pName in props) {
        let i = props[pName];
        obj[pName] = row[i];
    }

    return obj;
}

DbRowParser.prototype._processComplexProperties = function(obj, props, row) {
    for (var pName in props) {
        let pDef = props[pName];
        let parser = pDef.parser;

        let v = parser.parseRow(row);

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

DbRowParser.prototype._splitCoreFromComplexProperties = function(propertyDef) {
    let coreProps = {};
    let complexProps = {};

    for (var pName in propertyDef) {
        let i = propertyDef[pName];

        if ((typeof i) === "object") {
            let parser = i.parser;
            if (!(parser instanceof DbRowParser)) {
                throw new Error(`Unknown Parser for property {pName}: ` + typeof parser);
            }
            complexProps[pName] = i;
        } else {
            coreProps[pName] = i;
        }
    }

    return [coreProps, complexProps];
}
