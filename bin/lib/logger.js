'use strict';

var winston = require('winston');
//PosixSyslog = require('winston-posix-syslog').PosixSyslog;

var LogConfig = function() {};

var defaultConfiguration = {
    console: {
        level: 'info',
        colorize: 'true'
    }
};

/*
var syslogConfiguration = {
    PosixSyslog: {
        level: 'info',
        identity: 'xRocket Server'
    }
};*/

function getConfiguration (label) {
    var conf = Object.create(defaultConfiguration);
    conf.console.label = label;
    // conf.PosixSyslog.label = label;
    return conf;
}

function configure (level) {
    console.log('configure xrocket logging');

    defaultConfiguration.console.level = level;
    // syslogConfiguration.PosixSyslog.level = level;

    // activate syslog by default
    //defaultConfiguration.PosixSyslog = syslogConfiguration.PosixSyslog;

    winston.loggers.add('xrocketd', getConfiguration('xrocketd'));
    winston.loggers.add('cm', getConfiguration('cm'));
    winston.loggers.add('router', getConfiguration('router'));
    winston.loggers.add('connrouter', getConfiguration('connrouter'));
    winston.loggers.add('logrouter', getConfiguration('logrouter'));
    winston.loggers.add('xeprouter', getConfiguration('xeprouter'));
    winston.loggers.add('module', getConfiguration('module'));
    winston.loggers.add('xep-0045', getConfiguration('xep-0045'));
    winston.loggers.add('xep-0060', getConfiguration('xep-0060'));
    winston.loggers.add('authentication', getConfiguration('authentication'));
    winston.loggers.add('postgresql', getConfiguration('postgresql'));
    winston.loggers.add('storage', getConfiguration('storage'));
    winston.loggers.add('webapi', getConfiguration('webapi'));

    winston.loggers.add('websocket', getConfiguration('websocket'));
    winston.loggers.add('socketio', getConfiguration('socketio'));
    winston.loggers.add('bosh', getConfiguration('bosh'));
}

module.exports = configure;
