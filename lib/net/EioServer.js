'use strict';

var util = require('util'),
    path = require('path'),
    engine = require('engine.io'),
    WsSocket = require('./WsSocket'),
    CS2Server = require('node-xmpp-server').C2SServer,
    C2SStream = require('node-xmpp-server').C2SStream,
    logger = require('../core/Logger')('websocket');

function EioServer(options) {
    options = options || {};

    // reset options autostart, because we do not want to open a tcp connection
    options.autostart = false;

    CS2Server.call(this, options);
    var self = this;

    // determine subpath
    /*var urlpath = 'engine';
    if (options.subpath) {
        urlpath = path.join(options.subpath,'engine');
    }*/

    var subpath = options.subpath || "";
    var engineOptions = {};
    engineOptions.path = path.join('/' , subpath , 'engine.io');

    var server = null;
    if (options.server)  {
        server = engine.attach(options.server, engineOptions);
    } else if (options.port) {
        var http = require('http').createServer().listen(options.port);
        server = engine.attach(http, engineOptions);
    } else {
        throw new Error('port or server parameter is missing');
    }

    server.on('connection', function(socket) {
        logger.debug("engine.io connection");
        var wsSocket = new WsSocket();
        wsSocket.init(socket);
        self.acceptConnection(wsSocket);
    });
}

util.inherits(EioServer, CS2Server);

EioServer.prototype.name = 'Engine.io Connection Manager';
EioServer.prototype.C2SStream = C2SStream;

module.exports = EioServer;