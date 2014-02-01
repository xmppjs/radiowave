'use strict';

var ltx = require('ltx'),
    util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0045'),
    Promise = require('bluebird'),
    XepComponent = require('../XepComponent'),
    JID = require('node-xmpp-core').JID,
    NS = require('./namespace');

// handler
var MessageHandler = require('./handler/message'),
    PresenceHandler = require('./handler/presence'),
    AffiliationHandler = require('./handler/affiliation'),
    InvitationHandler = require('./handler/invitation');

/*
 * XEP-0045: Multi-User Chat
 * http://xmpp.org/extensions/xep-0045.html
 */
function Muc(options) {
    this.options = options ||  {};

    this.subdomain = options.subdomain;
    this.domain = options.domain;

    XepComponent.call(this);

    this.autoCreateRoom = true;

    this.Users = options.storage.users;
    this.Lookup = options.storage.lookup;

    this.messageHandler = this.configureHandler(new MessageHandler());
    this.presenceHandler = this.configureHandler(new PresenceHandler());
    this.affliationHandler = this.configureHandler(new AffiliationHandler());
    this.invitationHandler = this.configureHandler(new InvitationHandler());
}
util.inherits(Muc, XepComponent);

Muc.prototype.name = 'XEP-0045: Multi-User Chat';

Muc.prototype.getDomain = function ()  {
    return this.subdomain + '.' + this.domain;
};

Muc.prototype.features = function () {
    return [];
};

Muc.prototype.initialize = function () {};

Muc.prototype.match = function (stanza) {
    var jid = new JID(stanza.attrs.to);
    var domain = this.getDomain();

    // check that the domain fits
    if (jid.getDomain().toString().localeCompare(domain) !== 0) {
        return false;
    }

    if (
        // message
        (stanza.is('message') && stanza.attrs.type === 'groupchat') ||
        // mediated invitation
        (stanza.is('message') && (stanza.getChild('x', NS.MUC_USER) && stanza.getChild('x', NS.MUC_USER).getChild('invite'))) ||
        // presence
        (stanza.is('presence')) ||
        // discovery
        (stanza.is('iq') && stanza.getChild('query', NS.DISCO_ITEMS)) ||
        (stanza.is('iq') && stanza.getChild('query', NS.DISCO_INFO)) ||
        // membership
        (stanza.is('iq') && stanza.getChild('query', NS.MUC_ADMIN))
    ) {
        logger.debug('detected meesage for Xep-0045 ' + domain);
        return true;
    }

    return false;
};

Muc.prototype.configureHandler = function (handler) {
    var self = this;

    handler.sendError = function ()  {
        self.sendError.apply(self, arguments);
    };
    handler.sendSuccess = function () {
        self.sendSuccess.apply(self, arguments);
    };
    handler.send = function () {
        self.send.apply(self, arguments);
    };

    return handler;
};

Muc.prototype.loadRoom = function (roomname) {
    var self = this;
    var identifier = null;
    return new Promise(function (resolve, reject) {
        logger.debug('lookup room');
        self.Lookup.find('muc', roomname)
            .then(
                function (ident) {
                    identifier = ident;
                    logger.debug(JSON.stringify(identifier));
                    return self.Users.user(identifier.user);
                }).then(
                function (user) {
                    return user.getRoom(identifier.resource);
                }).then(
                function (room) {
                    resolve(room);
                }).
        catch (function (err) {
            reject(err);
        });
    });
};

Muc.prototype.determineRoomname = function (stanza) {
    var roomjid = new JID(stanza.attrs.to);
    return roomjid.getLocal();
};

/**
 * creates a new room
 * @param node name of the pubsub node
 */
/*Muc.prototype.createRoom = function (name, configuration, callback) {
    logger.debug('create new pubsub node ' + name);

    // create a new pub sub node description
    var room = new MucRoom({
        name: name,
        subdomain: this.getSubdomain()
    });

    // set default parameter
    room.setConfiguration('muc#roomconfig_roomname', 'Title');

    // overwrite configuration
    for (var i = 0; i < configuration.length; i++) {
        logger.debug('set ' + name + ' key: ' + configuration[i].key + ' ' + configuration[i].value);
        room.setConfiguration(configuration[i].key, configuration[i].value);
    }

    // this.Storage.Rooms.add(room.getRoomDescription(), callback);

    callback(null, room);
};

Muc.prototype.handleOwnerCreate = function (stanza) {

};

Muc.prototype.handleOwnerDelete = function (stanza) {

};
*/

Muc.prototype.createRoom = function(userjid, roomname) {
    var self = this;

    logger.debug('create new room');
    return new Promise(function (resolve, reject) {
        var user = null;
        // extract new owner from jid
        self.Users.user(userjid.getLocal())
            .then(function (usr) {
                user = usr;
                logger.debug('found user' + JSON.stringify(usr) + ' ' + userjid.getLocal() + roomname);
                // create room
                return self.Lookup.add('muc', userjid.getLocal(), roomname, roomname);
            })
            .then(function (identifier) {
                logger.debug('identifier: ' + JSON.stringify(identifier));
                return user.createRoom(roomname);
            }).then(function (room) {
                logger.debug('found2 room: ' + JSON.stringify(room));
                resolve(room);
            }).catch(function (err) {
                reject(err);
            });
    });
};

/**
 * @desc Implement Muc 7.2
 * @param stanza full pubsub message stanza
 * @see http://xmpp.org/extensions/xep-0045.html#enter
 */
Muc.prototype.handleOccupantPresence = function (stanza) {
    logger.debug('muc handle presence');
    var self = this;

    var roomname = this.determineRoomname(stanza);

    this.loadRoom(roomname)
        .then(
            function (room) {
                self.presenceHandler.handlePresence(room, stanza);
            }).
    catch (function (err) {
        // room does not exist
        // if flag is not set, create a room, otherwise we send an error
        if (self.autoCreateRoom) {
            var userjid = new JID(stanza.attrs.from);
            self.createRoom(userjid, roomname).then(function (room) {
                // join the room
                self.presenceHandler.handlePresence(room, stanza);
            });
        } else {
            // room does not exists
            var errXml = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
            self.sendError(stanza, errXml);
        }
    });
};

/**
 * Implement 7.4
 * @see http: //xmpp.org/extensions/xep-0045.html#message
 */
Muc.prototype.handleOccupantMessage = function (stanza) {
    logger.debug('muc handle message');
    var self = this;

    var roomname = this.determineRoomname(stanza);
    var userjid = stanza.attrs.from;

    var room = null;
    this.loadRoom(roomname)
        .then(
            function (r) {
                room = r;
                // check if user is part of this room
                return room.getMember(userjid);
            })
        .then(
            function (member) {
                // we found the member
                self.messageHandler.sendMessage(stanza, room, member);
            })
        .
    catch (function (err) {
        logger.error(err);
        // room does not exists
        var errXml = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
        self.sendError(stanza, errXml);
    });
};

/*
 * Implement 7.8
 * @see http://xmpp.org/extensions/xep-0045.html#invite
 */
Muc.prototype.handleInvitations = function (stanza, x) {
    var self = this;

    var roomname = this.determineRoomname(stanza);

    this.loadRoom(roomname).then(
        function (room) {
            // blub
            self.invitationHandler.invite(room, stanza, x);
        }).
    catch (function (err) {
        logger.error(err);
        this.sendError(stanza);
    });

};

Muc.prototype.handleAdminRequests = function (stanza) {
    logger.debug('handleAdminRequests');
    var self = this;

    // determine type of request
    var method = null;

    var query = stanza.getChild('query', NS.MUC_ADMIN);
    var item = query.getChild('item');

    if (item && (
        (item.attrs.affiliation === NS.MUC_AFFILIATION_ADMIN) ||
        (item.attrs.affiliation === NS.MUC_AFFILIATION_MEMBER) ||
        (item.attrs.affiliation === NS.MUC_AFFILIATION_OWNER) ||
        (item.attrs.affiliation === NS.MUC_AFFILIATION_OUTCAST)
    )) {
        method = 'affiliationlist';
    }

    if (method) {
        var roomname = this.determineRoomname(stanza);
        logger.debug(roomname);

        this.loadRoom(roomname).then(
            function (room) {
                logger.debug('found: ' + room + ' and ' + method);

                switch (method) {
                case 'affiliationlist':
                    self.affliationHandler.list(room, stanza, item.attrs.affiliation);
                    break;
                }
            })
            .
        catch (function (err) {
            logger.error(err);
        });
    } else {
        this.sendError(stanza);
    }
};

Muc.prototype.handle = function (stanza) {
    logger.debug('muc route');

    var to = new JID(stanza.attrs.to);

    // handle presence request for specific room
    if (stanza.is('presence') && (to.getDomain().toString().localeCompare(this.getDomain) !== 0)) {
        this.handleOccupantPresence(stanza);
    }

    // handle messages
    var msg = stanza.is('message');
    if (msg && stanza.attrs.type === 'groupchat') {
        this.handleOccupantMessage(stanza);
    }

    // handle invitations
    var x = stanza.getChild('x', NS.MUC_USER);
    if (msg && x && x.getChild('invite')) {
        this.handleInvitations(stanza, x);
    }

    // admin request
    if (stanza.is('iq') && stanza.getChild('query', NS.MUC_ADMIN)) {
        this.handleAdminRequests(stanza);
    }

    // TODO handle normal presence request
    // 1. check if user is already offline
    // 2. make user offline in all active rooms

};

module.exports = Muc;