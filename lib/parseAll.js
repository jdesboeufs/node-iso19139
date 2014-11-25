/*
** Module dependencies
*/
var es = require('event-stream');
var parse = require('./parse');


/*
** Methods
*/
function parseAll(options) {
    options = options || {};

    if (options.async) {
        return es.map(function(record, callback) {
            callback(null, parse(record));
        });
    } else {
        return es.mapSync(function(record) {
            return parse(record);
        });
    }
}


/*
** Exports
*/
module.exports = parseAll;
