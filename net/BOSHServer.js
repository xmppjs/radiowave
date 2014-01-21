'use strict';

var http = require('http'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    XmppBOSHServer = require('./bosh/BOSHServer'), //require('node-xmpp-server').BOSHServer,
    C2SStream = require('node-xmpp-server').C2SStream;

var winston = require('winston'),
    logger = winston.loggers.get('bosh');

/**
 * [BOSHServer description]
 *
 *   options.port : BOSH_PORT
 *   options.autostart : autostarts the server
 *
 * Some default ports are:
 * - http://example.com:5280/http-bind
 * - https://example.com:5281/http-bind
 */
function BOSHServer(options) {
    this.options = options ||  {};

    if (!options.autostart) {
        options.autostart = true;
    }

    EventEmitter.call(this);

    var self = this;
    this.c2s = null;

    this.bosh = new XmppBOSHServer();

    // listen for connect events from bosh
    this.bosh.on('connect', function (boshsession) {
        logger.debug('bosh connect');

        // create new stream
        var stream = new C2SStream({
            connection: boshsession
        });

        // emit new stream
        self.emit('connect', stream);
    });

    this.bosh.on('error', function (error) {
        logger.error(error);
    });

    // start bosh server
    if (this.options.autostart) {
        this.port = this.options.port || this.BOSH_PORT;

        // start bosh http port 
        http.createServer(function (req, res) {
            self.bosh.handleHTTP(req, res);
        }).listen(options.port);
    }
}

util.inherits(BOSHServer, EventEmitter);

BOSHServer.prototype.name = 'BOSH Connection Manager';

BOSHServer.prototype.C2SStream = C2SStream;
BOSHServer.prototype.BOSH_PORT = 5280;

BOSHServer.prototype.shutdown = function () {

    // we have to shutdown all connections
    this.emit('shutdown');

    // shutdown server
    // TODO not yet implemented
    //this.bosh.close()
};

module.exports = BOSHServer;