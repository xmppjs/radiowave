'use strict';

var ltx = require('ltx'),
    util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xepcomponent'),
    XepComponent = require('../XepComponent'),
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

Muc.prototype.initialize = function() {
    var filename = path.resolve(__dirname , './storage/schema.json');
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

/**
 * creates a new room
 * @param node name of the pubsub node
 */
Muc.prototype.createNode = function (name, configuration, callback) {
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

    this.Storage.Rooms.add(room.getRoomDescription(), callback);
};

Muc.prototype.handleCreate = function (stanza) {

}

Muc.prototype.handleDelete = function (stanza) {

}

Muc.prototype.handle = function (stanza) {
    logger.debug("muc route");

    var toJid = new xmpp.JID(stanza.attrs.to);

    // handle create room

    /*
    // handle presence request
    if (stanza.is('presence')) {
        this.handlePresence(stanza);
    }

    // handle messages
    if (stanza.is('message') && stanza.attrs.type === "groupchat") {
        this.handleMessage(stanza);
    }

    // handle disco request
    if (stanza.is('iq') && stanza.attrs.type === "get") {
        this.handleDisco(stanza);
    }
    */
};

module.exports = Muc;