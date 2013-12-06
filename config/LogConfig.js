'use strict';

var winston = require('winston');

winston.loggers.add('xrocket', {
    console: {
        level: 'silly',
        colorize: 'true',
        label: 'xrocket'
    }
});

winston.loggers.add('cm', {
    console: {
        level: 'silly',
        colorize: 'true',
        label: 'cm'
    }
});

winston.loggers.add('router', {
    console: {
        level: 'silly',
        colorize: 'true',
        label: 'router'
    }
});

winston.loggers.add('connrouter', {
    console: {
        level: 'silly',
        colorize: 'true',
        label: 'connrouter'
    }
});

winston.loggers.add('logrouter', {
    console: {
        level: 'silly',
        colorize: 'true',
        label: 'logrouter'
    }
});

winston.loggers.add('xeprouter', {
    console: {
        level: 'silly',
        colorize: 'true',
        label: 'xeprouter'
    }
});

winston.loggers.add('xepcomponent', {
    console: {
        level: 'silly',
        colorize: 'true',
        label: 'component'
    }
});

winston.loggers.add('authentication', {
    console: {
        level: 'silly',
        colorize: 'true',
        label: 'auth'
    }
});

winston.loggers.add('postgresql', {
    console: {
        level: 'silly',
        colorize: 'true',
        label: 'postgresql'
    }
});