'use strict';

var util = require('util'),
  EventEmitter = require('events').EventEmitter,
  ltx = require('ltx'),
  logger = require('./Logger')('xroute');

function XRoute() {
  EventEmitter.call(this);
}

util.inherits(XRoute, EventEmitter);

XRoute.prototype.name = 'XRoute';

/**
 * verify if a given stanza can be handled by this module
 * This method should be implemented as optimal as possible
 * because it will be called quite often.
 */
XRoute.prototype.match = function (stanza) {};

/**
 * handles xmpp stanzas
 * This method is called once a stanza has been verified via match,
 * therefore we can expect that the stanza fits to the module
 */
XRoute.prototype.handle = function (stanza) {};

/**
 * send messages and start routing
 */
XRoute.prototype.send = function (stanza) {
  // logger.debug(this.name + ' send stanza: ' + stanza.toString());
  this.emit('send', stanza);
};

/**
 * Send an error to the original sender of the message
 *
 * @params stanza original message from the sender
 */
XRoute.prototype.sendError = function (stanza, err) {
  var response = new ltx.Element(stanza.getName(), {
    from: stanza.attrs.to,
    to: stanza.attrs.from,
    id: stanza.attrs.id,
    type: 'error'
  });

  // attach error detail
  if (err) {
    response.cnode(err);
  }

  this.send(response);
};

/**
 * Respond with success to the original message
 *
 * @params stanza original message from the sender
 */
XRoute.prototype.sendSuccess = function (stanza, detail) {
  var response = new ltx.Element('iq', {
    from: stanza.attrs.to,
    to: stanza.attrs.from,
    id: stanza.attrs.id,
    type: 'result'
  });

  // attach error detail
  if (detail) {
    response.cnode(detail);
  }

  this.send(response);
};

XRoute.prototype.listenTo = function (route) {
  var self = this;
  route.on('stanza', function (stanza) {
    if (stanza) {
      logger.debug(route.name + ' forward to ' + self.name + ':  ' + stanza.attrs.from + ' -> ' + stanza.attrs.to);
      self.handle(stanza);
    }
  });
};

XRoute.prototype.chain = function (route) {
  var self = this;

  // forward stream eventing
  route.listenTo(this);

  // backward stream eventing
  route.on('send', function (stanza) {
    if (stanza) {
      logger.debug(route.name + ' send out to ' + self.name + ':  ' + stanza.attrs.from + ' -> ' + stanza.attrs.to);
      self.send(stanza);
    }
  });

  return route;
};

module.exports = XRoute;
