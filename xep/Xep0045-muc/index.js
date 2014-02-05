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
        // owner
        (stanza.is('iq') && stanza.getChild('query', NS.MUC_OWNER)) ||
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
        return self.sendError.apply(self, arguments);
    };
    handler.sendSuccess = function () {
        return self.sendSuccess.apply(self, arguments);
    };
    handler.send = function () {
        return self.send.apply(self, arguments);
    };
    handler.getDomain =  function () {
        return self.getDomain.apply(self, arguments);
    };

    return handler;
};

Muc.prototype.loadRoom = function (roomname) {
    var self = this;
    var identifier = null;
    return new Promise(function (resolve, reject) {
        self.Lookup.find('muc', roomname)
            .then(
                function (ident) {
                    identifier = ident;
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

Muc.prototype.handleOwnerRequests = function (stanza) {
    logger.error('owner request not implemented yet' + stanza.toString());
    return true;
};

/**
 * @param userjid JID of the user
 * @param roomname name of the room
 */
Muc.prototype.createRoom = function(userjid, roomname) {
    var self = this;

    logger.debug('create new room');
    return new Promise(function (resolve, reject) {
        var user = null;
        var room = null;

        // extract new owner from jid
        self.Users.user(userjid.getLocal())
            .then(function (usr) {
                user = usr;
                logger.debug('found user' + JSON.stringify(usr) + ' ' + userjid.getLocal() + roomname);
                // create room
                return self.Lookup.add('muc', userjid.getLocal(), roomname, roomname);
            })
            .then(function (identifier) {
                return user.createRoom(roomname);
            }).then(function (r) {
                room = r;
                logger.debug('created room: ' + JSON.stringify(room));
                // add creator as member
                return room.addMember(userjid);
            }).then(function () {
                // set affiliation properly for creator
                return self.affliationHandler.setOwner(room, userjid);
            }).then(function(){
                resolve(room);
            })
            .catch(function (err) {
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

    return true;
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

    return true;
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

    return true;
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

        this.loadRoom(roomname).then(
            function (room) {
                logger.debug('found room: ' + JSON.stringify(room) + ' and ' + method);

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

    return true;
};

Muc.prototype.handle = function (stanza) {
    logger.debug('muc route');

    var to = new JID(stanza.attrs.to);
    var handled = false;

    if (stanza.is('presence')) {
        // handle presence request for specific room
        if (to.getDomain().toString().localeCompare(this.getDomain) !== 0) {
            handled = this.handleOccupantPresence(stanza);
        }

        // TODO handle normal presence request
        // 1. check if user is already offline
        // 2. make user offline in all active rooms
    }
    else if (stanza.is('message')) {
        // handle messages
        var msg = stanza.is('message');
        var x = stanza.getChild('x', NS.MUC_USER);
        if (msg && stanza.attrs.type === 'groupchat') {
            handled = this.handleOccupantMessage(stanza);
        }
        // handle invitations
        else if (msg && x && x.getChild('invite')) {
            handled = this.handleInvitations(stanza, x);
        }
    }
    else if (stanza.is('iq')) {
        // owner request
        if (stanza.getChild('query', NS.MUC_OWNER)) {
            handled = this.handleOwnerRequests(stanza);
        }
        // admin request
        else if (stanza.getChild('query', NS.MUC_ADMIN)) {
            handled = this.handleAdminRequests(stanza);
        }
    }

    if (!handled) {
        logger.error('cound not process: ' + stanza.toString());
    }

};

module.exports = Muc;