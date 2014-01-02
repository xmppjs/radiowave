'use strict';

var pg = require('pg'),
    winston = require('winston'),
    logger = winston.loggers.get('postgresql');

var PConnection = function (conn) {
    this.connection = conn;
    this.client = null;
};

PConnection.prototype = {

    connect: function(callback) {
        var that = this;
        pg.connect(this.connection, function(err, pgclient) {
            if (err) {
                logger.error('error fetching client from pool ' + err.stack);
            } else {
                logger.debug('connection established');
                that.client = pgclient;
            }

            if (callback) {
                callback(err);
            }
        });
    },

    getClient: function() {
        return this.client;
    },

    disconnect: function()  {
        this.client.end();
    },
};

module.exports = PConnection;