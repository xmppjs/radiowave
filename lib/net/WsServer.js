'use strict';

var util = require('util'),
    WebSocketServer = require('ws').Server,
    WsSocket = require('./WsSocket'),
    CS2Server = require('node-xmpp-server').C2SServer,
    C2SStream = require('node-xmpp-server').C2SStream,
    logger = require('../core/Logger')('websocket');

function WsServer(options) {
    // reset options autostart, because we do not want to open a tcp connection
    options.autostart = false;

    CS2Server.call(this, options);
    var self = this;

    var wss = new WebSocketServer({port: options.port});
    wss.on('connection', function(socket) {
        logger.debug("websocket connection");
        var wsSocket = new WsSocket();
        wsSocket.init(socket);
        self.acceptConnection(wsSocket);
    });
}

util.inherits(WsServer, CS2Server);

WsServer.prototype.name = 'Websocket Connection Manager';
WsServer.prototype.C2SStream = C2SStream;

module.exports = WsServer;