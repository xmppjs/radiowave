'use strict';

var JID = require('node-xmpp-core').JID,
    logger = require('../../core/Logger')('webapi'),
    url = require('url'),
    querystring = require('querystring'),
    Promise = require('bluebird');

var _ = require('lodash')

function getJID(req) {
    logger.debug(JSON.stringify(req.user));
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

// implement as promise
function roomToJSON(userjid, room, meetingsPath) {
    var self = this;
    return new Promise(function (resolve, reject) {
        var jsonroom = room.toJSON();

        logger.debug('generate json for ' + JSON.stringify(jsonroom));

        // add additional information

        // determine owner and user from members and overwrite member information to 
        // remove internal information

        var members = jsonroom.members;
        jsonroom.members = [];
        var owner_username = '';

        // try to fetch members because we should always have at least one owner
        // the following captures a strange behaviour in sequelize
        // works for now, but should be harmonized
        if (!members) {
            logger.debug('try to fetch members');

            room.getMembers().then(function (members) {

                members.forEach(function (member) {

                    jsonroom.members.push({
                        jid: member.jid,
                        affiliation: member.affiliation,
                        role: member.role,
                        nickname: member.nickname
                    });

                    // found owner
                    if (member.affiliation === 'owner') {
                        jsonroom.owner = {
                            jid: member.jid,
                            affiliation: member.affiliation,
                            role: member.role,
                            nickname: member.nickname
                        };

                        owner_username = new JID(member.jid).getLocal(true).toString();
                    }

                    // found requesting user
                    console.log('compare jids');
                    console.log(member.jid);
                    console.log(userjid.toString());
                    if (member.jid == userjid.toString()) {
                        jsonroom.user = {
                            jid: member.jid,
                            affiliation: member.affiliation,
                            role: member.role,
                            nickname: member.nickname,
                            state: member.state
                        };
                    }

                });

                jsonroom.url = url.resolve(meetingsPath, querystring.escape(owner_username) + '/' + querystring.escape(jsonroom.name));

                logger.debug(JSON.stringify(jsonroom));
                resolve(jsonroom);
            });
        } else if (members && members.length > 0) {
            members.forEach(function (member) {

                logger.debug('got members' + JSON.stringify(member));

                jsonroom.members.push({
                    jid: member.jid,
                    affiliation: member.affiliation,
                    role: member.role,
                    nickname: member.nickname
                });

                // found owner
                if (member.affiliation === 'owner') {
                    jsonroom.owner = {
                        jid: member.jid,
                        affiliation: member.affiliation,
                        role: member.role,
                        nickname: member.nickname
                    };

                    owner_username = new JID(member.jid).getLocal(true).toString();
                }

                // found requesting user
                console.log('compare jids');
                console.log(member.jid);
                console.log(userjid.toString());
                if (member.jid == userjid.toString()) {
                    jsonroom.user = {
                        jid: member.jid,
                        affiliation: member.affiliation,
                        role: member.role,
                        nickname: member.nickname,
                        state: member.state
                    };
                }

            });

            jsonroom.url = url.resolve(meetingsPath, querystring.escape(owner_username) + '/' + querystring.escape(jsonroom.name));
            logger.debug(JSON.stringify(jsonroom));
            resolve(jsonroom);
        } else {
            logger.debug(JSON.stringify(jsonroom));
            resolve(jsonroom);
        }
    });
}

function roomsToJSON(userjid, rooms, meetingsPath) {
    return new Promise(function (resolve, reject) {

        // add owner and url to json output
        var jsons = [];

        // add owner to outout
        rooms.forEach(function (room) {
            jsons.push(roomToJSON(userjid, room, meetingsPath));
        });

        Promise.all(jsons).then(function (results) {
            logger.debug('json content: ' + JSON.stringify(results));
            resolve(results);
        }).
        catch (function (err) {
            reject();
        });
    });
}

module.exports = {
    getJID: getJID,
    exportJSON: exportJSON,
    serverPath: serverPath,
    roomToJSON: roomToJSON,
    roomsToJSON: roomsToJSON
};