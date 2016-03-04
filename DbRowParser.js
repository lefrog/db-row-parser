"use strict"

const util = require('util');
const events = require('events');

const DbRowParser = function(options) {
    if (!(this instanceof DbRowParser)) {
        return new DbRowParser(options);
    }

    events.EventEmitter.call(this);

    this._key = options.key || 0;

    if (!options.properties) {
        this._parser = new SingleValueParser(options);
    } else if (Array.isArray(options.properties)) {
        this._parser = new ObjectParser(options);
    } else {
        this._parser = new ArrayParser(options);
    }

    this._previousKey = null;
    this._currentObj = null;
}

util.inherits(DbRowParser, events.EventEmitter);

module.exports = DbRowParser;

// HACK: circular reference. Must be after module.exports.
const SingleValueParser = require("./SingleValueParser");
const ArrayParser = require("./ArrayParser");
const ObjectParser = require("./ObjectParser");

DbRowParser.prototype.end = function() {
    if (this._currentObj == null) {
        return;
    }

    this.emit("new-object", this._currentObj);
    this._currentObj = null;
}

DbRowParser.prototype.parseRow = function(row) {
    let key = row[this._key];

    if (key === this._previousKey) {
        this._parser.buildChildObject(this._currentObj, row);
        return this._currentObj;
    }

    if (key == null) {
        this.end();
        return;
    }

    if (key !== this._previousKey) {
        this.end();
    }

    this._previousKey = key;

    this._currentObj = this._parser.buildObject(row);

    return this._currentObj;
}

DbRowParser.assertIsParser = function(pName, parser) {
    if (!(parser instanceof DbRowParser)) {
        let t = typeof parser;
        throw new Error(`Unknown Parser for property "${pName}": ${t}`);
    }
}
