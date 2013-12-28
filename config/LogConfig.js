'use strict';

var winston = require('winston'),
    PosixSyslog = require('winston-posix-syslog').PosixSyslog;

var LogConfig = function() {};

var defaultConfiguration = {
    console: {
        level: 'debug',
        colorize: 'true',
    }
}

var syslogConfiguration = {
    PosixSyslog: {
        level: 'silly',
        identity: 'xRocket Server'
    } 
}

function getConfiguration (label) {
    var conf = Object.create(defaultConfiguration);
    conf.console.label = label;
    conf.PosixSyslog.label = label;
    return conf;
} 

LogConfig.prototype.configure = function(level) {

    defaultConfiguration.console.level = level;
    syslogConfiguration.PosixSyslog.level = level;

    // activate syslog by default
    defaultConfiguration.PosixSyslog = syslogConfiguration.PosixSyslog;

    winston.loggers.add('xrocket', getConfiguration('xrocket'));
    winston.loggers.add('cm', getConfiguration('cm'));
    winston.loggers.add('router', getConfiguration('router'));
    winston.loggers.add('connrouter', getConfiguration('connrouter'));
    winston.loggers.add('logrouter', getConfiguration('logrouter'));
    winston.loggers.add('xeprouter', getConfiguration('xeprouter'));
    winston.loggers.add('xepcomponent', getConfiguration('xepcomponent'));
    winston.loggers.add('authentication', getConfiguration('authentication'));
    winston.loggers.add('postgresql', getConfiguration('postgresql'));
};

module.exports = new LogConfig();
