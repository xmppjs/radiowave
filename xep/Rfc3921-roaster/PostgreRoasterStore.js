'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xepcomponent');

/*
# sample SQL statements to work with roaster entries

DROP TABLE roaster;
CREATE TABLE roaster (id SERIAL, jid TEXT, item JSON);
CREATE INDEX ON roaster(jid);
CREATE INDEX ON roaster((item->>'id'));

INSERT INTO roaster (jid, item) VALUES ('julia@example.net' ,'{
      "jid" : "romeo@example.net",
      "name" : "Romeo",
      "subscription":"from",
      "group": ["Friends", "Lovers"]
}');

INSERT INTO roaster (jid, item) VALUES ('julia@example.net' ,'{
      "jid" : "mercutio@example.net",
      "name" : "Mercutio",
      "subscription":"none",
      "group": ["Friends"]
}');

# read all roaster items
SELECT jid, item FROM roaster;
SELECT item FROM roaster where jid = 'julia@example.net';

# read all roaster items and return them as complete json
SELECT array_to_json(ARRAY(SELECT item FROM roaster));

# read specific roaster item
SELECT item FROM roaster where jid = 'julia@example.net' and item->>'jid' = 'romeo@example.net';

# update roaster item
UPDATE roaster
SET item = '{
      "jid" : "romeo@example.net",
      "name" : "Romeo II",
      "subscription":"from",
      "group": ["Friends", "Lovers"]
}'
WHERE jid= 'julia@example.net' and item->>'jid' = 'romeo@example.net';

# delete
DELETE FROM roaster WHERE jid= 'julia@example.net' and item->>'jid' = 'romeo@example.net';

*/


/**
 * Manage a roaster of a jid and stores this information in a postgre database.
 * As a basic requirement we expect at least postgre 9.3 due to the excellent
 * JSON support.
 *
 * A sample roaster item looks like:
 *
 * {
 *     jid : 'romeo@example.net',
 *     name : 'Romeo',
 *     subscription:'none',
 *     group: ['Friends', 'Lovers']
 * }
 * 
 */
var Roaster = function(options) {
    if (!options || !options.client) {
        throw new Error('Postgres connection string is not supplied');
    }

    this.client = options.client;
};

Roaster.prototype = {

    /**
     * Returns the roaster items
     * @param  jid      jid of the roaster owner
     * @param  callback error and roaster item array, 
     *                  returns an empty array if no items are in roaster
     */
    list: function(jid, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var select = this.client.query({
            name: 'roaster_select',
            text: 'SELECT array_to_json(ARRAY(SELECT item FROM roaster where jid = $1)) as item;',
            values: [jid]
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
                        callback(null, result.rows[0].item);
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

    /**
     * returns roaster item if successful or null if an error occured
     */
    add: function(jid, item, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var query = this.client.query({
            name: 'roaster_add',
            text: 'INSERT INTO roaster (jid, item) VALUES ($1 ,$2);',
            values: [jid, JSON.stringify(item)]
        });

        query.on('error', function(error) {
            console.log(error);
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

    /**
     * updates a roaster item
     */
    update: function(jid, item, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var query = this.client.query({
            name: 'roaster_update',
            text: 'UPDATE roaster SET item = $1 WHERE jid= $2 and item->>\'jid\' = $3;',
            values: [item, jid, item.jid]
        });

        query.on('error', function(error) {
            err = error;
        });

        query.on('end', function(result) {
            if (result.rowCount === 0 ) {
                err = 'No rows affected';
            }

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

    delete: function(jid, item, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var query = this.client.query({
            name: 'roaster_delete',
            text: 'DELETE FROM roaster WHERE jid= $1 and item->>\'jid\' = $2;',
            values: [jid, item.jid]
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

module.exports = Roaster;