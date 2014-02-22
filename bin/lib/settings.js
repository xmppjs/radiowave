'use strict';

var nconf = require('nconf'),
    Promise = require('bluebird'),
    winston = require('winston'),
    express = require('express'),
    logger = winston.loggers.get('xrocketd');

function Settings() {}

// detect if multiple parts use the same port
Settings.prototype.detectMultiPort = function (settings) {

    var connection = settings.get('connection');

    if (connection) {

        var portitems = connection.slice(0);

        // add api port for inspection
        var api = settings.get('api');
        if (api) {
            portitems.push(api);
        }

        // find multiport
        var ports = [];
        var multiport = null;

        portitems.forEach(function (item) {
            logger.debug('port: ' + item.port);
            if (item && !item.port) {
                // port is not defined, use existing multiport or create one
                if (!multiport) {
                    // use environment port or fallback to port 8080
                    multiport = process.env.PORT || 8080;
                }
            } else if (ports.indexOf(item.port) > 0) {
                if (!multiport) {
                    multiport = item.port;
                }
            } else {
                ports.push(item.port);
            }
        });

        if (multiport) {
            logger.info('detected multiport: ' + multiport);

            // listen on port
            var app = express();
            var server = require('http').createServer(app);
            server.listen(multiport);

            var serverConfig = {
                'port': multiport,
                'app': app,
                'server': server
            };

            settings.set('multiport', serverConfig);
        }
        return true;
    } else {
        logger.error('config does not include any connection port');
        return false;
    }
};

Settings.prototype.load = function (settingsfile) {
    var self = this;
    return new Promise(function (resolve, reject) {
        logger.debug('Load file: ' + settingsfile);
        nconf.argv().env().file({
            file: settingsfile
        });

        // load config here
        process.env.NODE_ENV = nconf.get('environment');

        logger.debug('Environment: ' + nconf.get('environment'));

        var result = self.detectMultiPort(nconf);

        if (result) {
            resolve(nconf);
        } else {
            reject('could not properly load config file');
        }
    });
};

module.exports = Settings;