'use strict';

var util = require('util'),
    engine = require('engine.io'),
    WsSocket = require('./WsSocket'),
    CS2Server = require('node-xmpp-server').C2SServer,
    C2SStream = require('node-xmpp-server').C2SStream;

function EioServer(options) {
    // reset options autostart, because we do not want to open a tcp connection
    options.autostart = false;

    CS2Server.call(this, options);
    var self = this;

    var server = null;
    if (options.server)  {
        server = engine.attach(options.server, {});
    } else if (options.port) {
        var http = require('http').createServer().listen(options.port);
        server = engine.attach(http, {});
    } else {
        throw new Error('port or server parameter is missing');
    }

    server.on('connection', function(socket) {
        console.log("engine.io connection");
        var wsSocket = new WsSocket();
        wsSocket.init(socket);
        self.acceptConnection(wsSocket);
    });
}

util.inherits(EioServer, CS2Server);

EioServer.prototype.name = 'Engine.io Connection Manager';
EioServer.prototype.C2SStream = C2SStream;

module.exports = EioServer;