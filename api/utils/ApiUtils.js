'use strict';

var JID = require('node-xmpp-core').JID,
    url = require('url');

function getJID(req) {
    console.log(JSON.stringify(req.user));
    return new JID(req.user.jid);
}

function exportJSON(model) {
    if (model instanceof Array) {
        var exportVal = [];
        model.forEach(function (item) {
            exportVal.push(exportJSON(item));
        });
        return exportVal;
    } else if (model && typeof (model.exportJSON) === 'function') {
        return model.exportJSON();
    } else {
        return model.toJSON();
    }
}

function serverPath(req) {

    var path = req.url;
    return url.resolve(req.protocol + '://' + req.get('host'), path);
}

function roomToJSON(ownerJid, room, meetingsPath) {
    var jsonroom = room.toJSON();
    var owner = ownerJid.getLocal().toString();
    jsonroom.owner = owner;
    jsonroom.url = url.resolve(meetingsPath,  owner + '/' + jsonroom.name);
    return jsonroom;
}

function roomsToJSON(ownerJid, rooms, meetingsPath) {
    // add owner and url to json output
    var results = [];

    // add owner to outout
    rooms.forEach(function (room) {
        results.push(roomToJSON(ownerJid, room, meetingsPath));
    });

    return results;
}

module.exports = {
    getJID: getJID,
    exportJSON: exportJSON,
    serverPath: serverPath,
    roomToJSON: roomToJSON,
    roomsToJSON: roomsToJSON
};