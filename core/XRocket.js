'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xrocket'),
    ConnectionRouter = require('../router/ConnectionRouter');

var XRocket = function () {
    this.connectionManagers = [];
    this.connectionRouter = new ConnectionRouter();
    logger.info('start XRocket server');
};

XRocket.prototype = {
    // add multiple connection manager
    addConnectionManager: function (connMgr) {
        logger.debug('load connection manager ' + connMgr.name);

        // store connection manager
        this.connectionManagers.push(connMgr);

        // attach to events from connection and forward them 
        // to the connection router
        connMgr.on('connect', this.connectionRouter.messageHandler());
    },

    // shutdown the connection manger
    shutdown : function () {
        logger.info('shutdown XRocket server');

        for (var i = 0, l = this.connectionManagers.length; i < l; i++) {
            this.connectionManagers[i].shutdown();
        }
    },

    // chain router events
    chain: function (router) {
        return this.connectionRouter.chain(router);
    }
};

module.exports = XRocket;