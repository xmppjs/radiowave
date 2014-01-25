'use strict';

var winston = require('winston'),
    logConfig = require('./config/LogConfig');

// set log level
logConfig(winston, 'silly');

module.exports = {
    Api : require('./api/routes'),
    Xep : require('./xep'),
    Router : require('./router'),
    Net : require('./net'),
    Auth :require('./auth'),
    XRocket : require('./core/XRocket'),
    Storage : require('./storage/in-memory')
};