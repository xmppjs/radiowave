'use strict';

var EventEmitter = require('events').EventEmitter,
  util = require('util');

var logger = require('../core/Logger')('socketio');

function IOSocket() {
  EventEmitter.call(this);

  //this.url = url;
  this.xmlns = {};
  this.websocket = null;

  this.writable = true;
  this.readable = true;

}
util.inherits(IOSocket, EventEmitter);

IOSocket.prototype.maxStanzaSize = 65535;

IOSocket.prototype.init = function (socket) {
  logger.debug('set socket: ');
  this.websocket = socket;
  var self = this;

  this.websocket.on('connect', function () {
    logger.debug('IOSocket connected');
  });

  this.websocket.on('message', function (body) {
    logger.debug('IOSocket message');
    //logger.debug("we got data: " + body);

    //if (body.type === 'utf8') {
    //string = body.utf8Data
    var string = body;
    if (string.match(/<stream:stream .*\/>/)) {
      string = string.replace('/>', '>');
    }
    //logger.debug("we changed data: " + string);
    self.emit('data', string);
    //}
    //else if (message.type === 'binary') {
    /* No support binary for now!*/
    //}

  });

  this.websocket.on('disconnect', function () {
    logger.debug('IOSocket disconnect');
    self.emit('end');
    self.emit('close');
  });
  this.websocket.on('error', function () {
    logger.debug('IOSocket error');
    self.emit('error');
  });

  this.websocket.on('close', function () {
    logger.debug('IOSocket close');
    self.emit('close');
  });

  self.emit('connect');

};

IOSocket.prototype.serializeStanza = function (s, clbk) {
  clbk(s.toString()); // No specific serialization
};

IOSocket.prototype.write = function (data) {
  this.websocket.emit('message', data);
};

IOSocket.prototype.pause = function () {
  // nothing to do
  logger.debug('socket.io is requested to pause. But we cannot do anything');
};

IOSocket.prototype.resume = function () {
  // nothing to do
  logger.debug('socket.io is requested to resume. But we cannot do anything');
};

IOSocket.prototype.end = function () {
  // nothing to do
  logger.debug('socket.io is requested to resume. But we cannot do anything');
};

module.exports = IOSocket;
