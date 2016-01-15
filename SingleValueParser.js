"use strict"

const SingleValueParser = function(options) {
    if (!(this instanceof SingleValueParser)) {
        return new SingleValueParser(options);
    }

    if (!options.key) {
        throw new Error("Missing key option");
    }

    this._key = options.key;
}

module.exports = SingleValueParser;

SingleValueParser.prototype.buildObject = function(row) {
    return row[this._key];
}
