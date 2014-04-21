'use strict';

var JID = require('node-xmpp-core').JID,
    url = require('url'),
    querystring = require('querystring');

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

/**
 * req : http request
 * host: override http host (optional)
 */
function serverPath(req, host) {

    // determine request url
    var path = req.originalUrl;

    // remove first and last slash
    path = path.replace(/^\/|\/$/g, '');

    // calculate real request url
    var requrl = null;
    if (host) {
        requrl = url.resolve(host, path);
    } else {
        requrl = url.resolve(req.protocol + '://' + req.get('host'), path);
    }

    return requrl.replace(/\/$/, "");
}

function findOwner(members, ownerJid) {

    if (members) {
        var owner = null;
        members.forEach(function (member) {
            if (member.roomMember.affiliation === 'owner') {
                if (member.jid) {
                    owner = new JID(member.jid).getLocal(true).toString();
                }
            }
        });
        return owner;
    } else if (ownerJid){
        return ownerJid.getLocal(true).toString();
    } else {
        return null;
    }
}

function roomToJSON(ownerJid, room, meetingsPath) {
    var jsonroom = room.toJSON();

    jsonroom.owner = findOwner(jsonroom.members, ownerJid);
    delete jsonroom.members;

    jsonroom.url = url.resolve(meetingsPath, querystring.escape(jsonroom.owner) + '/' + querystring.escape(jsonroom.name));
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