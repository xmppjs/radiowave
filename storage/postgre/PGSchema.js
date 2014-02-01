'use strict';

/*
 *
 * var schema =   {
 *     name: 'pubsub',
 *     type: 'postgresql'
 *     versions: [{
 *         version: "0.0.2"
 *         description : "Data model for pubsub items",
 *         statements: [
 *             "CREATE TABLE pubsub_items (id SERIAL, subdomain TEXT, node TEXT, itemid TEXT, sender TEXT,  entry TEXT);",
 *             "CREATE INDEX ON pubsub_items(subdomain);",
 *             "CREATE INDEX ON pubsub_items(node);",
 *             "CREATE INDEX ON pubsub_items(itemid);"
 *         ]
 *     }, {
 *         version: "0.0.1",
 *         description : "Data model for pubsub nodes",
 *         statements: [
 *             "CREATE TABLE pubsub_nodes (id SERIAL, node JSON);",
 *             "CREATE INDEX ON pubsub_nodes ((node->>'name'));",
 *             "CREATE INDEX ON pubsub_nodes ((node->>'subdomain'));"
 *         ]
 *     }]
 * };
 */

var fs = require('fs'),
    winston = require('winston'),
    logger = winston.loggers.get('postgresql');


var PGSchema = function (client) {
    this.client = client;
};

PGSchema.prototype = {

    // we expect a file with a json description
    create: function (description) {
        var self = this;

        var resultHandler = function (err, result) {
            logger.debug(err);
            logger.debug(result);
        };


        // order statements in inverse order (newest is on top)
        var version = 0;
        for (var i = description.versions.length - 1; i >= 0; i--) {
            version = description.versions[i];

            logger.debug(description.name + ' action create: ' + version.description + '(' + version.version + ')');

            for (var j = 0, k = version.statements.length; j < k; j++) {
                logger.debug(description.name + ' ' + version.statements[j]);
                self.client.query(version.statements[j], resultHandler);
            }

        }
    },

    run: function (filename) {
        logger.debug('Load schema from ' + filename);
        var self = this;

        // read schema description
        fs.readFile(filename, function (err, data) {
            if (err) {
                logger.error(err);
            }
            try {
                var schema = JSON.parse(data);
                self.create(schema);
            } catch (err) {
                logger.error(err.message);
            }
        });
    }
};

module.exports = PGSchema;