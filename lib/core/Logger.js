'use strict';

var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'xrocket',
    streams: [
        {
            name: 'stdout',
            stream: process.stdout,
            level: 'debug'
        },
        {
            name: 'stderr',
            stream: process.stderr
        }
    ]
});

function logger(name) {
    return log.child({
        widget_type: name
    });
}

module.exports = logger;