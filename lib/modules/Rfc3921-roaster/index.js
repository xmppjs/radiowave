'use strict';

var ltx = require('ltx'),
    util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('module'),
    XepModule = require('../../core/XepModule'),
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

    this.options = options;

    XepModule.call(this);

    this.storage = options.storage;
}
util.inherits(Roaster, XepModule);

Roaster.prototype.name = 'RFC 3921: Roaster';
Roaster.prototype.version = '0.1.0';

Roaster.prototype.Error = {
    NotFound: ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>')
};

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
    item.group = JSON.stringify(groupItems);

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
            name: item.Roaster.name,
            subscription: item.Roaster.subscription
        });

        // iterate over group items
        if (item.Roaster.group) {
            try {
                var groups = JSON.parse(item.Roaster.group);
                for (var j = 0; j < groups.length; j++) {
                    console.log(groups[j]);
                    xitem.c('group').t(groups[j]);
                }
            } catch(err) {

            }
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

    this.storage.User.find({
            where: {
                jid: jid.toString()
            }
        }).success(function(user) {
            console.log('roaster user: '+ JSON.stringify(user));
            user.getRoaster().success(function(list){
                console.log('roaster entries: ' + JSON.stringify(list));

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

            }).error(function(err){
                logger.error(err);
                self.sendError(stanza);
            });

        }).error(function(err){
            logger.error(err);
            self.sendError(stanza);
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
    logger.error(err);
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
        var roasteritem = this.convertXMLtoJSON(item);
        logger.debug(item.toString());
        logger.debug(JSON.stringify(roasteritem));
        if (!this.verifyItem(roasteritem)) {
            throw new Error('roaster item not properly set');
        }

        this.storage.User.find({
            where: {
                jid: jid.toString()
            }
        }).success(function(user) {
            if (user) {
                // search friend:
                self.storage.User.find({
                    where: {
                        jid: roasteritem.jid
                    }
                }).success(function (friend) {

                    if (friend) {
                        // extract from roasteritem
                        user.addRoaster(friend, {name: roasteritem.name, group: roasteritem.group, subscription: 'none'}).success(function(){
                            self.sendOk(stanza);
                        });
                    } else {
                        self.sendError(stanza);
                    }
                }).error(function(err){
                    self.sendError(stanza);
                });

            } else {
                self.sendError(stanza);
            }

        }).error(function(err){
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
        var roasteritem = this.convertXMLtoJSON(item);

        if (!this.verifyItem(roasteritem)) {
            throw new Error('roaster item not properly set');
        }

        this.storage.User.find({
            where: {
                jid: jid.toString()
            }
        }).success(function(user) {
            if (user) {
                // search friend:
                self.storage.User.find({
                    where: {
                        jid: roasteritem.jid
                    }
                }).success(function (friend) {

                    if (friend) {
                        // extract from roasteritem
                        user.removeRoaster(friend).success(function(){
                            self.sendOk(stanza);
                        });
                    } else {
                        self.sendError(stanza);
                    }
                }).error(function(err){
                    logger.error(err);
                    self.sendError(stanza);
                });

            } else {
                self.sendError(stanza);
            }
        }).error(function(err){
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