'use strict';

var util = require('util'),
  XRoute = require('../core/XRoute'),
  logger = require('../core/Logger')('comprouter');

/**
 * encapsulates multiple components behind a router
 *
 */
function ComponentRouter(options) {
  XRoute.call(this);

  this.xmppdomain = options.domain;
  this.components = [];
}
util.inherits(ComponentRouter, XRoute);

ComponentRouter.prototype.name = 'ComponentRouter';

ComponentRouter.prototype.connect = function () {
  // emit events for pipe
  this.emit('connect');
};

ComponentRouter.prototype.getDomain = function () {
  return this.xmppdomain;
};

ComponentRouter.prototype.match = function (stanza) {
  var match = false;

  var self = this;
  this.components.forEach(function (component) {
    try {
      if (component.match(stanza)) {
        match = true;
      }
    } catch (err) {
      logger.error(err.stack);
    }
  });

  return match;
};

ComponentRouter.prototype.handle = function (stanza) {
  logger.debug(this.name + ' handle ' + stanza.toString());

  // check the to field is properly set. otherwise we expect this server
  if (!stanza.attrs.to) {
    stanza.attrs.to = this.getDomain();
  }

  // emit events for pipe
  this.emit('stanza', stanza);

  // iterate over components and let them handle

  var handled = false;
  for (var i = 0, l = this.components.length; i < l; i++) {
    var component = this.components[i];

    try {
      // handle events
      if (component.match(stanza)) {
        logger.debug('handle stanza with ' + component.name);
        handled = component.handle(stanza);
      }
      // TODO send an error if we ware not able to deliver this message
    } catch (err) {
      logger.error(err.stack);
    }
  }

  if (!handled) {
    this.sendError(stanza);
  }

  return handled;
};

ComponentRouter.prototype.disconnect = function () {
  // emit events for pipe
  this.emit('disconnect');
};

ComponentRouter.prototype.addComponent = function (component) {

  // initialize component
  component.initialize();

  // store component
  this.components.push(component);

  // we cannot chain components, because handle will decide for a specific component
  // anyway we need the route back
  var self = this;
  component.on('send', function (stanza) {
    // logger.debug(component.name + ' send out to ' + self.name + ':  ' + stanza.toString());
    self.send(stanza);
  });

};

ComponentRouter.prototype.removeComponent = function () {

  // TODO we need to implement this
};

module.exports = ComponentRouter;