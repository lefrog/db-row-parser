"use strict";

const util_mod = require('util');
const stream_mod = require('stream');
const DbRowParser = require("./DbRowParser");

const DbRowParserStream = function(options) {
    if (!(this instanceof DbRowParserStream)) {
        return new DbRowParserStream(options);
    }

    stream_mod.Transform.call(this, {readableObjectMode: true, writableObjectMode: true});

    this._rowParser = options.rowParser;
    let self = this;
    this._rowParser.on("new-object", (obj) => {
        self._onNewObject(obj);
    });

    this._objBuffer = [];
}

util_mod.inherits(DbRowParserStream, stream_mod.Transform);

module.exports = DbRowParserStream;

DbRowParserStream.prototype._transform = function(row, encoding, cb) {
    this._pushQueuedObject();
    this._rowParser.parseRow(row);
    cb();
}

DbRowParserStream.prototype._flush = function(cb) {
    this._rowParser.end();
    for (let i=0; i<this._objBuffer.length; i++) {
        this.push(this._objBuffer[i]);
    }
    cb();
}

DbRowParserStream.prototype._onNewObject = function(obj) {
    this._objBuffer.push(obj);
}

DbRowParserStream.prototype._pushQueuedObject = function() {
    let keepPushing, i;
    keepPushing = true;
    for (i=0; i<this._objBuffer.length && keepPushing; i++) {
        let obj = this._objBuffer[i];
        keepPushing = this.push(obj);
    }
    this._objBuffer = this._objBuffer.splice(i);
}
