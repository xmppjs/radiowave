'use strict';

var Sequelize = require('sequelize'),
    Promise = require('bluebird'),
    models = require('../../storage/models');

/**
 * Manage the database abstraction for xrocket
 */
var Storage = function (options) {

    this.opt = options;

    this.database = options.database;
    this.dbuser = options.databaseuser;
    this.dbpassword = options.databasepassword;
    this.dialect = options.dialect;
    this.dbhost = options.host;
    this.dbport = options.port;

};

/**
 * Initialize the datababe and sync the tables if they are not
 * already there.
 */
Storage.prototype.initialize = function () {
    var self;
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
        if (self.dialect) {
            options.dialect = self.dialect;
        }

        if (self.host) {
            options.host = self.host;
        }

        if (self.port) {
            options.port = self.port;
        }

        // path of the db file for sqlite 
        if (self.storage) {
            options.storage = self.storage;
        }

        // initialize db connection
        self.sequelize = new Sequelize(
            self.options.database,
            self.options.databaseuser,
            self.options.databasepassword, options);

        // load all models as own properties
        models(self.sequelize, self);

        // sync models with database
        self.sequelize.sync()
            .complete(function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(self);
                }
            });
    });
};

module.exports = Storage;