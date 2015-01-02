'use strict';

var util = require('util'),
  logger = require('../core/Logger')('starrouter'),
  XRoute = require('../core/XRoute');

/**
 * The star router sends recieves events and forwards them to
 * any router that matches. This includes the sender.
 *
 * We distigish between `Sender` and `Reciever` Router. Some
 * consume and some produce. But even `Reciever` send events
 * to respond to the original request.
 *
 * `Sender` emit `stanza` events to forward messages
 * `Reciever` emit `send` events to backward messages
 *
 * The `StarRouter` distingish between both by the way you chain it
 *
 *   starRouter = new StarRouter();
 *
 *   // add sending router
 *   connectionRouter.chain(starRouter)
 *
 *   // add recieving router
 *   starRouter.chain(componentRouter);
 */
function StarRouter() {
  XRoute.call(this);

  this.routes = [];
}
util.inherits(StarRouter, XRoute);

StarRouter.prototype.name = 'StarRouter';

/**
 * will be called if we cain router to star routes
 */
StarRouter.prototype.handle = function (stanza) {
  var handled = false;

  logger.debug(this.name + ' handle:  ' + stanza.attrs.from + ' -> ' + stanza.attrs.to);

  if (!stanza.attrs.to) {
    logger.warn('discarded message because to attribute is missing: ' + stanza.toString());
    return;
  }

  // check the match for each route and let the route handle this stuff
  for (var i = 0, l = this.routes.length; i < l; i++) {
    var route = this.routes[i];

    if (!handled) {
      try {
        logger.debug('check if message fits to: ' + route.route.name);
        // handle events
        if (route.route.match(stanza)) {
          logger.debug('handle stanza with ' + route.route.name);
          if (route.type === 'reciever') {
            logger.debug('use handle');
            // call handle for Reciever
            handled = route.route.handle(stanza);
          } else {
            // call send for Sender
            logger.debug('use send');
            handled = route.route.send(stanza);
          }
        }
      } catch (err) {
        logger.error(err.stack);
      }
    }
  }

  if (!handled) {
    logger.warn('discarded message: ' + stanza.toString());
  }
};

/**
 * send messages and start routing
 */
StarRouter.prototype.send = function (stanza) {
  // we do not emit events, because this would lead to event looks
  this.handle(stanza);
};


StarRouter.prototype.listenTo = function (route) {

  // store routes
  this.routes.push({
    route: route,
    type: 'sender'
  });

  // call parent function
  StarRouter.super_.prototype.listenTo.apply(this, arguments);
};

/**
 * here we store the route and listen for events
 */
StarRouter.prototype.chain = function (route) {

  // store routes
  this.routes.push({
    route: route,
    type: 'reciever'
  });

  // call parent function
  return StarRouter.super_.prototype.chain.apply(this, arguments);
};

module.exports = StarRouter;