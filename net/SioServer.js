'use strict';

var util = require('util'),
    sio = require('socket.io'),
    SioSocket = require('./SioSocket'),
    CS2Server = require('node-xmpp-server').C2SServer,
    C2SStream = require('node-xmpp-server').C2SStream;

/**
 * params:
 *   options : port on which to listen to C2S connections
 *   options.port : xmpp socket io socket port
 *   options.domain : domain of xmpp server
 *
 *   options.requestCert : expect a client certificate (see tls.createSecurePair for more)
 *   options.rejectUnauthorized : reject when client cert missmatches (see tls.createSecurePair for more)
 *   options.tls : wrapper object for tlc config
 *   options.tls.key : private key string
 *   options.tls.cert : certificate string
 *   options.tls.keyPath : path to key
 *   options.tls.certPath : path to certificate
 *
 *   options.server : http or https server
 *   options.transports : sets the active transports
 */
function SIOServer(options) {
    this.options = options ||  {};

    // reset options autostart, because we do not want to open a tcp connection
    options.autostart = false;

    CS2Server.call(this, options);
    var self = this;

    var io = null;
    if (options.server)  {
        io = sio.listen(options.server);
    } else if (options.port) {
        io = sio.listen(options.port);
    } else {
        throw new Error('port or server parameter is missing');
    }

    io.configure('production', function () {
        io.enable('browser client etag');
        io.set('log level', 1);


    });

    var transports = options.transports ||  [
        'websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling'
    ];

    io.set('transports', transports);


    io.sockets.on('connection', function (socket) {
        var sioSocket = new SioSocket();
        self.acceptConnection(sioSocket);
        sioSocket.init(socket);
    });
}

util.inherits(SIOServer, CS2Server);

SIOServer.prototype.name = 'SocketIO Connection Manager';
SIOServer.prototype.C2SStream = C2SStream;

module.exports = SIOServer;