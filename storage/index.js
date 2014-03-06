'use strict';

var Sequelize = require('sequelize'),
    Promise = require('bluebird'),
    models = require('./models');

var winston = require('winston'),
    logger = winston.loggers.get('storage');

/**
 * Manage the database abstraction for xrocket
 */
var Storage = function (options) {
    if (!options) {
        throw Error('no database options set');
    }
    this.opt = options;
};

/**
 * Initialize the datababe and sync the tables if they are not
 * already there.
 */
Storage.prototype.initialize = function (syncOpts) {
    logger.debug('initialize');

    syncOpts = syncOpts || {};
    var self = this;
    return new Promise(function (resolve, reject) {

        // base options
        var options = {
            language: 'en',
            maxConcurrentQueries: 100,
            pool: {
                maxConnections: 5,
                maxIdleTime: 30
            }
        };

        // could be sqlite, postgres, mysql
        if (self.opt.dialect) {
            options.dialect = self.opt.dialect;
        }

        if (self.opt.host) {
            options.host = self.opt.host;
        }

        if (self.opt.port) {
            options.port = self.opt.port;
        }

        // path of the db file for sqlite 
        if (self.opt.storage) {
            options.storage = self.opt.storage;
        }

        // initialize db connection
        var sequelize = new Sequelize(
            self.opt.database,
            self.opt.username,
            self.opt.password, options);
        self.sequelize = sequelize;

        // load all models as own properties
        models(sequelize, self);

        // sync models with database
        sequelize.sync(syncOpts)
            .complete(function (err) {
                if (err) {
                    logger.error(err);
                    reject(err);
                } else {
                    resolve(self);
                }
            });


    });
};

module.exports = Storage;