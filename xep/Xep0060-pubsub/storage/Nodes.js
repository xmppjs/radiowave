'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xepcomponent');

/*
var schema = {
    name: 'pubsub_nodes',
    type: 'postgresql'
    versions: [
    {
        version: "0.0.2"
        statements : [
            "CREATE INDEX ON pubsub_nodes ((node->>'name'));",
            "CREATE INDEX ON pubsub_nodes ((node->>'subdomain'));"
        ]
    },
    {
        version: "0.0.1"
        statements: [
            "DROP TABLE pubsub_nodes;",
            "CREATE TABLE pubsub_nodes (id SERIAL, node JSON);"
        ]
    }]
};
*/

/*
# sample SQL statements

DROP TABLE pubsub_nodes;
CREATE TABLE pubsub_nodes (id SERIAL, node JSON);
CREATE INDEX ON pubsub_nodes ((node->>'name'));
CREATE INDEX ON pubsub_nodes ((node->>'subdomain'));

INSERT INTO pubsub_nodes (node) VALUES ('{
    "name" : "nodename",
    "subdomain" : "pubsub"  
}');

# read all pubsub_nodes items
SELECT node FROM pubsub_nodes;
SELECT node FROM pubsub_nodes where node->>'name' = 'nodename';

# read all pubsub_nodes items and return them as complete json
SELECT array_to_json(ARRAY(SELECT node FROM pubsub_nodes)) as nodes;

# read specific pubsub_nodes item
SELECT node FROM pubsub_nodes where node->>'name' = 'nodename' and node->>'subdomain' = 'pubsub';

# update pubsub_nodes item
UPDATE pubsub_nodes
SET node = '{
    "name" : "nodename",
    "subdomain" : "pubsub",
    "subscription": {
        "romeo@example.net" : "",
        "julia@example.net" : ""
    },
    "fields" : {
        "pubsub#title" : "pubsub title",
        "pubsub#description" : "pubsub description"
    }
}'
WHERE node->>'name' = 'nodename' and node->>'subdomain' = 'pubsub';

# delete
DELETE FROM pubsub_nodes WHERE node->>'name' = 'nodename' and node->>'subdomain' = 'pubsub';
*/

/**
 *
 * A sample node looks like 
 * 
 * {
 *     name : 'nodename',
 *     subdomain : 'pubsub',
 *     subscription: {
 *         'romeo@example.net' : {},
 *         'julia@examplenet' : {}
 *     },
 *     fiels : {
 *         'pubsub#title' : 'pubsub title'
 *         'pubsub#description' : 'pubsub description',
 *     }
 * }
 */
var Nodes = function(options) {
    if (!options || !options.client) {
        throw new Error('Postgres connection string is not supplied');
    }

    this.client = options.client;
};

Nodes.prototype = {

    get: function(subdomain, nodename, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;

        var select = this.client.query({
            name: 'pubsub_nodes_select_item',
            text: 'SELECT node FROM pubsub_nodes WHERE node->>\'subdomain\' = $1 AND node->>\'name\' = $2;',
            values: [subdomain, nodename]
        });

        select.on('row', function(row, result) {
            result.addRow(row);
        });

        select.on('error', function(error) {
            err = error;
        });

        select.on('end', function(result) {
            if (err) {
                if (callback) {
                    callback(err, null);
                }
            } else {
                // proper list
                if (result.rows && result.rows.length >= 1) {
                    if (callback) {
                        // logger.debug(JSON.stringify(result.rows[0].node));
                        callback(null, result.rows[0].node);
                    }
                }
                // not found
                else {
                    if (callback) {
                        callback(null, null);
                    }
                }
            }
        });
    },

    list: function(subdomain, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var select = this.client.query({
            name: 'pubsub_nodes_select',
            text: 'SELECT array_to_json(ARRAY(SELECT node FROM pubsub_nodes where node->>\'subdomain\' = $1)) as nodes;',
            values: [subdomain]
        });

        select.on('row', function(row, result) {
            result.addRow(row);
        });

        select.on('error', function(error) {
            err = error;
        });

        select.on('end', function(result) {
            
            if (err) {
                logger.error(err);
                if (callback) {
                    callback(err, null);
                }
            } else {
                // proper list
                if (result.rows && result.rows.length >= 1) {
                    if (callback) {
                        callback(null, result.rows[0].nodes);
                    }
                }
                // empty list
                else {
                    if (callback) {
                        callback(null, []);
                    }
                }
            }
        });
    },

    add: function(node, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var query = this.client.query({
            name: 'pubsub_nodes_add',
            text: 'INSERT INTO pubsub_nodes (node) VALUES ($1);',
            values: [JSON.stringify(node)]
        });

        query.on('error', function(error) {
            logger.error(error);
            err = error;
        });

        query.on('end', function() {
            if (err) {
                if (callback) {
                    callback(err, null);
                }
            } else {
                if (callback) {
                    callback(null, node);
                }
            }
        });

    },

    update: function(node, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var query = this.client.query({
            name: 'pubsub_nodes_update',
            text: 'UPDATE pubsub_nodes SET node = $1 WHERE node->>\'name\' = $2 and node->>\'subdomain\' = $3;',
            values: [JSON.stringify(node), node.name, node.subdomain]
        });

        query.on('error', function(error) {
            err = error;
        });

        query.on('end', function() {
            if (err) {
                if (callback) {
                    callback(err, null);
                }
            } else {
                if (callback) {
                    callback(null, node);
                }
            }
        });
    },

    /*
     * Deletes a node from storage
     * {
     *    name : 'nodename',
     *    subdomain : 'pubsub'
     * }
     */
    delete: function(node, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var query = this.client.query({
            name: 'pubsub_nodes_delete',
            text: 'DELETE FROM pubsub_nodes WHERE node->>\'name\' = $1 and node->>\'subdomain\' = $2;',
            values: [node.name, node.subdomain]
        });

        query.on('error', function(error) {
            err = error;
        });

        query.on('end', function() {
            if (err) {
                if (callback) {
                    callback(err, null);
                }
            } else {
                if (callback) {
                    callback(null, true);
                }
            }
        });
    }
};

module.exports = Nodes;