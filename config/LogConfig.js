'use strict';

var winston = require('winston');

var LogConfig = function () {};

LogConfig.prototype.configure = function (level) {

    winston.loggers.add('xrocket', {
        console: {
            level: level,
            colorize: 'true',
            label: 'xrocket'
        }
    });

    winston.loggers.add('cm', {
        console: {
            level: level,
            colorize: 'true',
            label: 'cm'
        }
    });

    winston.loggers.add('router', {
        console: {
            level: level,
            colorize: 'true',
            label: 'router'
        }
    });

    winston.loggers.add('connrouter', {
        console: {
            level: level,
            colorize: 'true',
            label: 'connrouter'
        }
    });

    winston.loggers.add('logrouter', {
        console: {
            level: level,
            colorize: 'true',
            label: 'logrouter'
        }
    });

    winston.loggers.add('xeprouter', {
        console: {
            level: level,
            colorize: 'true',
            label: 'xeprouter'
        }
    });

    winston.loggers.add('xepcomponent', {
        console: {
            level: level,
            colorize: 'true',
            label: 'component'
        }
    });

    winston.loggers.add('authentication', {
        console: {
            level: level,
            colorize: 'true',
            label: 'auth'
        }
    });

    winston.loggers.add('postgresql', {
        console: {
            level: level,
            colorize: 'true',
            label: 'postgresql'
        }
    });
};

module.exports = new LogConfig();