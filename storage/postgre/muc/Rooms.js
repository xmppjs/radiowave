'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xepcomponent');

/*
# sample SQL statements

DROP TABLE muc_rooms;
CREATE TABLE muc_rooms (id SERIAL, room JSON);
CREATE INDEX ON muc_rooms ((room->>'name'));
CREATE INDEX ON muc_rooms ((room->>'subdomain'));

INSERT INTO muc_rooms (room) VALUES ('{
    "name" : "roomname",
    "subdomain" : "pubsub"  
}');

# read all muc_rooms
SELECT room FROM muc_rooms;
SELECT room FROM muc_rooms where room->>'name' = 'roomname';

# read all muc_rooms items and return them as complete json
SELECT array_to_json(ARRAY(SELECT room FROM muc_rooms)) as rooms;

# read specific muc_rooms item
SELECT room FROM muc_rooms where room->>'name' = 'roomname' and room->>'subdomain' = 'chat';

# update muc_rooms item
UPDATE muc_rooms
SET room = '{
    "name" : "roomname",
    "subdomain" : "chat",
    "members": {
        "romeo@example.net" : "",
        "julia@example.net" : ""
    },
    "fields" : {
        "muc#roomconfig_roomname" : "room title"
    }
}'
WHERE room->>'name' = 'roomname' and room->>'subdomain' = 'chat';

# delete
DELETE FROM muc_rooms WHERE room->>'name' = 'roomname' and room->>'subdomain' = 'chat';
*/

/**
 *
 * A sample room looks like 
 * 
 * {
 *     name : 'roomname',
 *     subdomain : 'chat',
 *     members: {
 *         'romeo@example.net' : {},
 *         'julia@examplenet' : {}
 *     },
 *     fields : {
 *         "muc#roomconfig_roomname" : "room title"
 *     }
 * }
 */
var Rooms = function(options) {
    if (!options || !options.client) {
        throw new Error('Postgres connection string is not supplied');
    }

    this.client = options.client;
};

Rooms.prototype = {

    get: function(subdomain, roomname, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;

        var select = this.client.query({
            name: 'muc_rooms_select_item',
            text: 'SELECT room FROM muc_rooms WHERE room->>\'subdomain\' = $1 AND room->>\'name\' = $2;',
            values: [subdomain, roomname]
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
                        callback(null, result.rows[0].room);
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
            name: 'muc_rooms_select',
            text: 'SELECT array_to_json(ARRAY(SELECT room FROM muc_rooms where room->>\'subdomain\' = $1)) as rooms;',
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

    add: function(room, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var query = this.client.query({
            name: 'muc_rooms_add',
            text: 'INSERT INTO muc_rooms (room) VALUES ($1);',
            values: [JSON.stringify(room)]
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
                    callback(null, room);
                }
            }
        });

    },

    update: function(room, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var query = this.client.query({
            name: 'muc_rooms_update',
            text: 'UPDATE muc_rooms SET room = $1 WHERE room->>\'name\' = $2 and room->>\'subdomain\' = $3;',
            values: [JSON.stringify(room), room.name, room.subdomain]
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
                    callback(null, room);
                }
            }
        });
    },

    /*
     * Deletes a room from storage
     * {
     *    name : 'roomname',
     *    subdomain : 'chat'
     * }
     */
    delete: function(room, callback) {
        if (!this.client) {
            callback('no established db connection');
        }

        var err = null;
        var query = this.client.query({
            name: 'muc_rooms_delete',
            text: 'DELETE FROM muc_rooms WHERE room->>\'name\' = $1 and room->>\'subdomain\' = $2;',
            values: [room.name, room.subdomain]
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

module.exports = Rooms;