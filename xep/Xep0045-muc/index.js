'use strict';

var ltx = require('ltx'),
    util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xepcomponent'),
    XepComponent = require('../XepComponent'),
    Message = require('node-xmpp-core').Stanza.Message,
    Presence = require('node-xmpp-core').Stanza.Presence,
    JID = require('node-xmpp-core').JID;

var path = require('path'),
    PGSchema = require('../../util/PGSchema');

var MucRoom = require('./MucRoom'),
    Storage = require('./storage');

var NS_MUC = "http://jabber.org/protocol/muc",
    NS_MUC_UNIQUE = "http://jabber.org/protocol/muc#unique",
    NS_MUC_USER = "http://jabber.org/protocol/muc#user",
    NS_DISCO_ITEMS = "http://jabber.org/protocol/disco#items",
    NS_DISCO_INFO = "http://jabber.org/protocol/disco#info";

var MUC_ROLE_ADMIN = "admin",
    MUC_ROLE_NONE = "none",
    MUC_ROLE_PARTICIPANT = "participant",
    MUC_ROLE_VISITOR = "visitor",
    MUC_AFFILIATION_OWNER = "owner",
    MUC_AFFILIATION_ADMIN = "admin",
    MUC_AFFILIATION_MEMBER = "member",
    MUC_AFFILIATION_OUTCAST = "outcast",
    MUC_AFFILIATION_NONE = "none";

/*
 * XEP-0045: Multi-User Chat
 * http://xmpp.org/extensions/xep-0045.html
 */
function Muc(options) {
    this.options = options;

    this.subdomain = options.subdomain;
    this.domain = options.domain;

    XepComponent.call(this);

    this.Storage = {};
    if (options.storage) {
        this.Storage.Rooms = new Storage.Rooms(options.storage);
    } else {
        logger.warn("Muc cannot be properly initialized because options.storage is not defined");
    }
}
util.inherits(Muc, XepComponent);

Muc.prototype.name = 'XEP-0045: Multi-User Chat';

Muc.prototype.features = function () {
    return [];
};

Muc.prototype.initialize = function () {
    var filename = path.resolve(__dirname, './storage/schema.json');
    (new PGSchema(this.options.storage.client)).run(filename);
};

Muc.prototype.match = function (stanza) {

    var domain = this.subdomain + '.' + this.domain;
    var jid = new JID(stanza.attrs.to);

    // check that the domain fits
    if (jid.getDomain().toString().localeCompare(domain) !== 0) {
        logger.debug('Muc ' + domain + ' does not accept ' + jid.toString());
        return false;
    }

    if (stanza.is('message') && stanza.attrs.type === 'groupchat') {
        logger.debug('detected muc ' + domain);
        return true;
    }

    if (stanza.is('presence')) {
        logger.debug('detected muc ' + domain);
        return true;
    }

    if (stanza.is('iq') && stanza.getChild('query', NS_DISCO_ITEMS)) {
        logger.debug('detected muc ' + domain);
        return true;
    }
    if (stanza.is('iq') && stanza.getChild('query', NS_DISCO_INFO)) {
        logger.debug('detected muc ' + domain);
        return true;
    }

    return false;
};

Muc.prototype.getNode = function(nodename, callback) {
    this.Storage.Nodes.get(this.getSubdomain(), nodename, callback);
};

/**
 * creates a new room
 * @param node name of the pubsub node
 */
Muc.prototype.createRoom = function (name, configuration, callback) {
    logger.debug('create new pubsub node ' + name);

    // create a new pub sub node description
    var room = new MucRoom({
        name: name,
        subdomain: this.getSubdomain()
    });

    // set default parameter
    room.setConfiguration('muc#roomconfig_roomname', "Title");

    // overwrite configuration
    for (var i = 0; i < configuration.length; i++) {
        logger.debug('set ' + name + ' key: ' + configuration[i].key + ' ' + configuration[i].value);
        room.setConfiguration(configuration[i].key, configuration[i].value);
    }

    // this.Storage.Rooms.add(room.getRoomDescription(), callback);

    callback(null, room);
};

Muc.prototype.handleOwnerCreate = function (stanza) {

}

Muc.prototype.handleOwnerDelete = function (stanza) {

}

Muc.prototype.sendPresenceLeave = function (roomjid, userjid, room) {
    // send client the confirmation
    var confirmMsg = new Presence({
        from: roomjid,
        to: userjid,
        type: "unavailable"
    });
    var x = confirmMsg.c('x', {
        'xmlns': NS_MUC_USER
    });
    x.c('item', {
        'affiliation': MUC_AFFILIATION_ADMIN,
        'role': MUC_ROLE_ADMIN
    });
    x.c('status', {
        'code': '110'
    });
    self.send(confirmMsg);

    // send new presense to exsting members
    var newPresence = new Presence({
        from: "",
        to: "",
        type: "unavailable"
    });
    newPresence.c('x', {
        'xmlns': NS_MUC_USER
    }).c('item', {
        'affiliation': MUC_AFFILIATION_ADMIN,
        'role': MUC_ROLE_ADMIN
    });

    // iterate over existing members
    room.eachMember(function (member) {
        // send existing room members the info
        var memberMessage = newPresence.clone();
        memberMessage.attrs.from = roomjid;
        memberMessage.attrs.to = member;
        self.send(memberMessage);
    }, jid);
};

Muc.prototype.sendPresenceJoin = function (roomjid, userjid, room) {
    // send client the confirmation
    var msg = new xmpp.Presence({
        from: "",
        to: userjid
    });
    msg.c('x', {
        'xmlns': NS_MUC_USER
    }).c('item', {
        'affiliation': MUC_AFFILIATION_ADMIN,
        'role': MUC_ROLE_ADMIN
    });

    // send presense to exsting members
    var newPresence = new xmpp.Presence({
        from: "",
        to: ""
    });
    newPresence.c('x', {
        'xmlns': NS_MUC_USER
    }).c('item', {
        'affiliation': MUC_AFFILIATION_ADMIN,
        'role': MUC_ROLE_ADMIN
    });

    // iterate over existing members
    room.eachMember(function (member) {
        // send existing room members the info
        var memberMessage = newPresence.clone();
        memberMessage.attrs.from = roomjid;
        memberMessage.attrs.to = member;
        self.send(memberMessage);

        // send presence of existing room member to new member
        var joinermsg = msg.clone();
        joinermsg.attrs.from = new xmpp.JID(room.name(), room.domain(), room.getNick(member));
        self.send(joinermsg, null);
    });
};

/**
 * @desc Implement Muc 7.2
 * @param stanza full pubsub message stanza
 * @see http://xmpp.org/extensions/xep-0045.html#enter
 */
Muc.prototype.handleOccupantPresence = function (stanza) {
    var self = this;
    var roomjid = new xmpp.JID(stanza.attrs.to);
    var x = stanza.getChild('x', NS_MUC);

    // extract data
    var userjid = stanza.attrs.from;
    var roomname = roomjid.user;
    var nick = roomjid.resource.toString();
    var room = this.rooms[roomname];

    // check if the room exists
    if (!room) {
        this.createRoom(roomname);

        this.createRoom(roomname, [], function (err, room) {

        });
    }

    // user leaves the room 
    // @see http://xmpp.org/extensions/xep-0045.html#exit
    if (room && stanza.attrs.type == "unavailable") {
        // leave room
        room.leave(jid);

        // delete local memory if all users logged out of room
        if (room.countMembers === 0) {
            this.closeRoom(roomname);
        }

        this.sendPresenceLeave(roomjid, userjid, room);

    }
    // user joins the room
    else {

        this.sendPresenceJoin(roomjid, userjid, room);

        // register user in room
        room.join(jid, nick);

        // send client the confirmation
        var confirmMsg = new xmpp.Presence({
            from: toJid,
            to: jid
        });
        var x = confirmMsg.c('x', {
            'xmlns': NS_MUC_USER
        });
        x.c('item', {
            'affiliation': MUC_AFFILIATION_ADMIN,
            'role': MUC_ROLE_ADMIN
        });
        x.c('status', {
            'code': '110'
        });
        self.send(confirmMsg);

        // send room history
        //room.eachMessage(function (el) {
        //    el.attrs.to = jid;
        //    self.send(el);
        //}, jid);
    }
}

/**
 * Implement 7.4
 * @see http://xmpp.org/extensions/xep-0045.html#message
 */
Muc.prototype.handleOccupantMessage = function (stanza) {
    logger.debug("muc handleMessage");
    var self = this;
    var toJid = new xmpp.JID(stanza.attrs.to);
    // route messages to room members

    // extract all data
    var fulljid = stanza.attrs.from;
    var roomname = toJid.user;


    //var nick = toJid.resource;
    var room = this.rooms[roomname];
    // TODO check if user has access to the room

    if (room) {

        // find nickname for user

        // extract message body
        var messagebody = stanza.children;

        // extract in message plugin
        var body = stanza.getChild('body');
        var markdown = ghm.parse(body.getText());

        var el = new ltx.Element('html');
        el.t(markdown);
        messagebody.push(el);

        // attach html body
        //messagebody

        // create empty message

        var nick = room.getNick(fulljid);

        var msg = new xmpp.Message({
            'from': new xmpp.JID(roomname, this.domain, nick),
            'to': "",
            'type': "groupchat"
        });
        msg.children = messagebody;

        // store message in history
        // only non forwarded messages need to be persisted, but they should be stored in memory
        room.addMessage(msg);

        // iterate over room members and submit message
        room.eachMember(function (member) {
            var clientmsg = msg.clone();
            clientmsg.attrs.to = member;
            //  logger.debug(clientmsg.toString());
            self.server.router.route(clientmsg, null);
        }, fulljid);
    } else {
        // TODO return error
    }
}

Muc.prototype.handle = function (stanza) {
    logger.debug("muc route");

    var toJid = new xmpp.JID(stanza.attrs.to);

    // handle presence request
    if (stanza.is('presence')) {
        this.handleOccupantPresence(stanza);
    }

    // handle messages
    if (stanza.is('message') && stanza.attrs.type === "groupchat") {
        this.handleOccupantMessage(stanza);
    }
};

module.exports = Muc;