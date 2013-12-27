'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xepcomponent');

/*
# sample SQL statements to work with pubsub items

DROP TABLE pubsub_items;
CREATE TABLE pubsub_items (id SERIAL, subdomain TEXT, node TEXT, itemid TEXT, sender TEXT,  entry TEXT);
CREATE INDEX ON pubsub_items(subdomain);
CREATE INDEX ON pubsub_items(node);
CREATE INDEX ON pubsub_items(itemid);

INSERT INTO pubsub_items (subdomain, node, itemid, sender, entry) 
VALUES ('pubsub', 'princely_musings', 'bnd81g37d61f49fgn581', 'hamlet@denmark.lit/blogbot', '<entry></entry>');

# read all items sender a sepecific node
SELECT subdomain, node FROM pubsub_items;
SELECT itemid, sender, entry FROM pubsub_items WHERE subdomain = 'pubsub' AND node = 'princely_musings' ;

# read specific pubsub item
SELECT itemid, sender, entry FROM pubsub_items WHERE subdomain = 'pubsub' AND node = 'princely_musings' AND itemid = 'bnd81g37d61f49fgn581';

# delete specific 
DELETE FROM pubsub_items WHERE subdomain = 'pubsub' AND node = 'princely_musings' AND itemid = 'bnd81g37d61f49fgn581';
*/

/**
 *
 * A sample item looks like 
 *
 * {
 *     subdomain : 'pubsub',
 *     node : 'princely_musings',
 *     id : 'bnd81g37d61f49fgn581',
 *     from : 'hamlet@denmark.lit/blogbot'
 *     entry : "<entry xmlns='http://www ... </entry>"
 * }
 *
 * This json is used as input / output document
 *
 */
var Items = function(options) {
    if (!options || !options.client) {
        throw new Error('Postgres connection string is not supplied');
    }

    this.client = options.client;
};

Items.prototype = {

    generateItem : function (row) {
        var item = {
            subdomain: row.subdomain,
            node: row.node,
            id: row.itemid,
            sender: row.sender,
            entry: row.entry
        };
        return item;
    },

    get: function(sudomain, node, itemid, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var self = this;

        var select = this.client.query({
            name: 'pubsub_items_select_item',
            text: 'SELECT subdomain, node, itemid, sender, entry FROM pubsub_items WHERE subdomain = $1 AND node = $2 AND itemid = $3;',
            values: [sudomain, node, itemid]
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
                        // we should only find one element. Therefore 
                        // we always use the first one
                        var row = result.rows[0];
                        callback(null, self.generateItem(row));
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

    list: function(sudomain, node, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var self = this;

        var select = this.client.query({
            name: 'pubsub_items_select',
            text: 'SELECT subdomain, node, itemid, sender, entry FROM pubsub_items WHERE subdomain = $1 AND node = $2 ;',
            values: [sudomain, node]
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
                    var items = [];

                    for (var i = 0; i < result.rows.length; i++) {
                        items.push(self.generateItem(result.rows[i]));
                    }

                    if (callback) {
                        callback(null, items);
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

    add: function(item, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var query = this.client.query({
            name: 'pubsub_items_add',
            text: 'INSERT INTO pubsub_items (subdomain, node, itemid, sender, entry) VALUES ($1 ,$2, $3 ,$4, $5);',
            values: [item.subdomain, item.node, item.id, item.sender, item.entry]
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
                    callback(null, item);
                }
            }
        });
    },

    delete: function(subdomain, node, itemid, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var query = this.client.query({
            name: 'pubsub_items_delete',
            text: 'DELETE FROM pubsub_items WHERE subdomain = $1 AND node = $2 AND itemid = $3;',
            values: [subdomain, node, itemid]
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

module.exports = Items;