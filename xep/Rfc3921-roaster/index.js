'use strict';

var ltx = require('ltx'),
    util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xepcomponent'),
    XepComponent = require('../XepComponent'),
    JID = require('node-xmpp-core').JID;

var NS_ROASTER = 'jabber:iq:roster';

/*
 * RFC 3921: Roaster
 * http://xmpp.org/rfcs/rfc3921.html#roster
 */
function Roaster(options) {
    // initialize options
    if (!options) {
        options = {};
    }

    // initialize storage options
    if (!options.storage) {
        options.storage = {};
    }

    this.options = options;

    XepComponent.call(this);

    this.Users = options.Users;
}
util.inherits(Roaster, XepComponent);

Roaster.prototype.name = 'RFC 3921: Roaster';

Roaster.prototype.version = '0.1.0';

Roaster.prototype.initialize = function () {
};

/*
 * Detects if the stanza is a roaster request
 *
 * Sample:
 * <iq from='juliet@example.com/balcony' type='get' id='roster_1'>
 *   <query xmlns='jabber:iq:roster'/>
 * </iq>
 */
Roaster.prototype.match = function (stanza) {
    if (stanza.is('iq') && stanza.attrs.type === 'get' && (stanza.getChild('query', NS_ROASTER))) {
        logger.debug('detected roaster get request');
        return true;
    } else if (stanza.is('iq') && stanza.attrs.type === 'set' && (stanza.getChild('query', NS_ROASTER))) {
        logger.debug('detected roaster set request');
        return true;
    }
    return false;
};

Roaster.prototype.convertXMLtoJSON = function (xmlItem) {
    logger.debug(xmlItem.root().toString());

    var item = {};
    // set jid
    item.jid = xmlItem.attrs.jid;

    // set name
    if (xmlItem.attrs.name) {
        item.name = xmlItem.attrs.name;
    }

    var groupItems = [];
    var groups = xmlItem.getChildren('group');
    for (var i = 0; i < groups.length; i++) {
        groupItems.push(groups[i].getText());
    }
    item.groups = groupItems;

    logger.debug("ITEM:" + JSON.stringify(item));

    return item;
};

Roaster.prototype.convertJSONtoXML = function (jsonList) {
    var query = new ltx.Element('query', {
        xmlns: NS_ROASTER
    });

    for (var i = 0; i < jsonList.length; i++) {
        var item = jsonList[i];

        var xitem = query.c('item', {
            jid: item.jid,
            name: item.name,
            subscription: item.subscription
        });

        // iterate over group items
        for (var j = 0; j < item.groups.length; j++) {
            console.log(item.groups[j]);
            xitem.c('group').t(item.groups[j]);
        }
    }
    return query;
};

/**
 * Returns the roaster list
 */
Roaster.prototype.handleGetRoaster = function (stanza) {
    var self = this;
    var jid = new JID(stanza.attrs.from).bare();

    var username = 'romeo';
    this.Users.user(username).then(
        function (user) {
            return user.listContacts();
        }).then(
        function (list) {
            var roasterResult = new ltx.Element('iq', {
                from: stanza.attrs.to,
                to: stanza.attrs.from,
                id: stanza.attrs.id,
                type: 'result'
            });

            if (!list) {
                list = [];
            }
            roasterResult.cnode(self.convertJSONtoXML(list));
            logger.debug(roasterResult.toString());
            logger.debug('send roaster to ' + stanza.attrs.from);
            self.send(roasterResult);
        }).then(
        function () {},
        function (err) {
            logger.debug('ERROR' + err);
            // channel does not exist
            errorXml = ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
            self.sendError(stanza, errorXml);
        });
};

Roaster.prototype.sendOk = function (stanza) {
    var roasterResult = new ltx.Element('iq', {
        from: stanza.attrs.to,
        to: stanza.attrs.from,
        id: stanza.attrs.id,
        type: 'result'
    });

    logger.debug('send roaster response to ' + stanza.attrs.from);
    this.send(roasterResult);
};

Roaster.prototype.sendError = function (stanza, err) {
    logger.error(err.stack);
    var roasterResult = new ltx.Element('iq', {
        from: stanza.attrs.to,
        to: stanza.attrs.from,
        id: stanza.attrs.id,
        type: 'error'
    });

    logger.debug('send roaster error to ' + stanza.attrs.from);
    this.send(roasterResult);
};

/**
 * Verifies a roaster item before we store it
 * @param  {[type]} item json roaster item
 * @return {[type]}      true if the item is okay
 */
Roaster.prototype.verifyItem = function (item) {
    if ((item === null) ||
        (item.jid === null) ||
        (item.jid === undefined)) {
        logger.error('jid not set');
        return false;
    }

    return true;
};

/**
 * Updates a roaster item
 */
Roaster.prototype.handleUpdateRoasterItem = function (stanza, item) {
    try {
        var self = this;
        var jid = new JID(stanza.attrs.from).bare();
        var jsonitem = this.convertXMLtoJSON(item);
        logger.debug(item.toString());
        logger.debug(JSON.stringify(jsonitem));
        if (!this.verifyItem(jsonitem)) {
            throw new Error('roaster item not properly set');
        }

        var username = 'romeo';
        this.Users.user(username).then(
            function (user) {
                return user.addOrUpdateContact(jsonitem.jid, jsonitem);
            }).then(
            function () {
                self.sendOk(stanza);
            }).then(
            function () {},
            function (err) {
                logger.error(err);
                self.sendError(stanza);
            });

    } catch (err) {
        self.sendError(stanza, err);
    }
};

/**
 * Deletes a roaster item
 */
Roaster.prototype.handleDeleteRoasterItem = function (stanza, item) {
    try {
        var self = this;
        var jid = new JID(stanza.attrs.from).bare();
        var jsonitem = this.convertXMLtoJSON(item);

        if (!this.verifyItem(jsonitem)) {
            throw new Error('roaster item not properly set');
        }

        var username = 'romeo';
        this.Users.user(username).then(
            function (user) {
                return user.removeContact(jsonitem.jid);
            }).then(
            function () {
                self.sendOk(stanza);
            }).then(
            function () {},
            function (err) {
                logger.error(err);
                self.sendError(stanza);
            });
    } catch (err) {
        self.sendError(stanza, err);
    }
};

/** 
 * handles the component requests
 */
Roaster.prototype.handle = function (stanza) {

    // return roaster list
    if (stanza.attrs.type === 'get') {
        this.handleGetRoaster(stanza);
    } else if (stanza.attrs.type === 'set') {
        var query = stanza.getChild('query', NS_ROASTER);
        var item = query.getChild('item');

        // delete an item
        if (item.attrs.subscription === 'remove') {
            this.handleDeleteRoasterItem(stanza, item);
        }
        // update an item
        else {
            this.handleUpdateRoasterItem(stanza, item);
        }
    } else {
        throw new Error('could not recognize roaster item');
    }
};

module.exports = Roaster;