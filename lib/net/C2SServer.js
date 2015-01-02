'use strict';

var C2SServer = require('node-xmpp-server').C2SServer,
  C2SStream = require('node-xmpp-server').C2SStream;

C2SServer.prototype.C2SStream = C2SStream;

C2SServer.prototype.name = 'C2S Server';

module.exports = C2SServer;
