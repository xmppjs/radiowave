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

    this.storage = options.storage;

    this.messageHandler = this.configureHandler(new MessageHandler(this.storage));
    this.presenceHandler = this.configureHandler(new PresenceHandler(this.storage));
    this.affliationHandler = this.configureHandler(new AffiliationHandler(this.storage));
    this.invitationHandler = this.configureHandler(new InvitationHandler(this.storage));
}
util.inherits(Muc, XepComponent);

Muc.prototype.name = 'XEP-0045: Multi-User Chat';

Muc.prototype.Error = {};
Muc.prototype.Error.NotFound = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');

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

Muc.prototype.findRoom = function (roomname) {
    var self = this;
    return new Promise(function (resolve, reject) {
        self.storage.Room.find({
                where: {
                    name: roomname
                }
            }).success(function (room) {
                resolve(room);
            }).error(function(err){
                reject(err);
            });
    });
};

Muc.prototype.findUser = function (jid) {

    var userjid = null;
    if (jid instanceof JID) {
        userjid = jid;
    } else {
        userjid = new JID(jid.toString());
    }

    var self = this;
    return new Promise(function (resolve, reject) {
        self.storage.User.find({
                where: {
                    jid: userjid.bare().toString()
                }
            }).success(function (user) {
                logger.debug('findUser: ' + JSON.stringify(user));
                resolve(user);
            }).error(function(err){
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
Muc.prototype.createRoom = function(user, roomname) {
    var self = this;

    logger.debug('create new room');
    return new Promise(function (resolve, reject) {
        // create new room
        self.storage.Room.create({
            name: roomname
        }).success(function (room) {
            // add assiciation between room and user
            user.addRoom(room, {
                role: 'moderator',
                affiliation: 'owner',
                nickname: ''
            }).success(function () {
                resolve(room);
            }).error(function (err) {
                reject(err);
            });
        }).error(function (err) {
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
    var userjid = stanza.attrs.from;

    var user = null;
    var room = null;

    this.findUser(userjid).then(function(u){
        user = u;

        // find room
        self.findRoom(roomname)
        .then(function (room) {
            // room exists
            self.presenceHandler.handlePresence(room, user, stanza);
        }).catch (function (err) {

            if (self.autoCreateRoom) {
                self.createRoom(user, roomname).then(function (room) {
                     // join the room
                    self.presenceHandler.handlePresence(room, user, stanza);
                });
            } else {
                logger.error(err);
                // room does not exist
                self.sendError(stanza, self.Error.NotFound);
            }
        });

    }).catch (function (err) {
        logger.error(err);
        // room does not exist
        self.sendError(stanza, self.Error.NotFound);
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

    var user = null;
    var room = null;

    // find user (may not be a member of the room)
    this.findUser(userjid).then(function(u){
        user = u;
        // find a room
        return self.findRoom(roomname);
    }).then(function(r){
        room = r;
        // found room, check that the user is a member of the room
        return room.isMember(user);
    }).then(function (member) {
        // we found the member
        self.messageHandler.sendMessage(room, member, stanza);
    }).catch (function (err) {
        logger.error(err);
        // room does not exists
        self.sendError(stanza, self.Error.NotFound);
    });

    return true;
};

/*
 * Implement 7.8
 * @see http://xmpp.org/extensions/xep-0045.html#invite
 */
Muc.prototype.handleInvitations = function (stanza, x) {
    logger.debug('handle invitations');
    var self = this;

    var userjid = stanza.attrs.to;
    var roomname = this.determineRoomname(stanza);

    var user = null;
    var room = null;

    // find user (may not be a member of the room)
    this.findUser(userjid).then(function(u){
        logger.debug('found user');
        user = u;
        // find a room
        return self.findRoom(roomname);
    }).then(function(r){
        room = r;
        logger.debug('found room');
        room.isMember(user).then(function() {
            logger.error('cannot invite because the user is already a member');
        }).catch(function(err){
            // user should not be a member already
            self.invitationHandler.invite(room, user, stanza, x);
        });
    }).
    catch (function (err) {
        console.error(err);
        logger.error(err);
        self.sendError(stanza);
    });

    return true;
};

Muc.prototype.handleDeclinedInvitations = function (stanza, x) {
    logger.debug('handle declined invitations');
    var self = this;

    var userjid = stanza.attrs.from;
    var roomname = this.determineRoomname(stanza);

    this.findRoom(roomname).then(
        function (room) {
            self.invitationHandler.declinedInvitation(room, stanza, x);
        }).
    catch (function (err) {
        logger.error(err);
        self.sendError(stanza);
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

        this.findRoom(roomname).then(
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
        // handle invitation declines
        else if (msg && x && x.getChild('decline')) {
            handled = this.handleDeclinedInvitations(stanza, x);
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