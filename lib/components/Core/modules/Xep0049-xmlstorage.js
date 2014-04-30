'use strict';

var ltx = require('ltx'),
    util = require('util'),
    logger = require('../../../core/Logger')('module'),
    XModule = require('../../../core/XModule');

var NS_PRIVATE = 'jabber:iq:private';

/*
 * XEP-0049: Private XML Storage
 * http://xmpp.org/extensions/xep-0049.html
 *
 * Status: Not Implemented
 * 
 */
function PrivateXMLStorage() {
    XModule.call(this);

    logger.info('load ' + this.name);
}
util.inherits(PrivateXMLStorage, XModule);

PrivateXMLStorage.prototype.name = 'XEP-0199: XMPP PrivateXMLStorage';

PrivateXMLStorage.prototype.version = '0.1.0';

/**
 * check if this component handles this type of message
 *
 * <iq type='get' xmlns='jabber:client' id='7957:sendIQ'>
 * <query xmlns='jabber:iq:private'>
 * <storage xmlns='storage:bookmarks'/></query>
 * </iq>
 */
PrivateXMLStorage.prototype.match = function (stanza) {
    if (stanza.is('iq') && stanza.attrs.type === 'get' && (stanza.getChild('query', NS_PRIVATE))) {
        logger.debug('detected XEP-0199 request');
        return true;
    }
    return false;
};

/*
PrivateXMLStorage.prototype.checkNamespace = function (namespace) {
    var forbiddenNamespace = ['jabber:', 'http://jabber.org/', 'vcard-temp'];

    if (forbiddenNamespace.indexOf(namespace.trim()) > -1) {
        return false;
    }
    return true;
};
*/

PrivateXMLStorage.prototype.storeData = function (stanza, data) {
    // extract name and namespace
    var child = data.children[0];
    logger.debug(child.name);
    logger.debug(child.attrs.xmlns);

    // TODO store data

    // store xml data
    this.sendSuccess(stanza);
};

PrivateXMLStorage.prototype.retrieveData = function (stanza, data) {
    logger.debug(stanza.toString());
    logger.debug(data);

    // TODO retrieve data

    var query = new ltx.Element('query', {
        xmlns: NS_PRIVATE,
    });
    this.sendSuccess(query);

};

/**
 * handle message, only applied after match
 */
PrivateXMLStorage.prototype.handle = function (stanza) {
    var handled = false;

    // return an error if request has noting set
    var data = stanza.getChild('query', NS_PRIVATE);
    if (data.children.length === 0 ||  data.children.length > 1) {
        // User attempts to get data without specifying child element/namespace
        // or has to many childs.
        var error = ltx.parse('<error code=\'406\' type=\'modify\'><bad-format xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');
        this.sendError(stanza, error);
        handled = true;
    }

    // Client stores private data
    if (stanza.attrs.type === 'set') {
        this.storeData(stanza, data);
        handled = true;
    }

    // Client retrieves private data
    if (stanza.attrs.type === 'get') {
        this.retrieveData(stanza, data);
        handled = true;
    }

    return handled;

    // User Attempts to Get or Set Data for Another User
    //error = ltx.parse('<error code=\'403\' type=\'cancel\'><forbidden xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');

    // User Attempts to Get or Set Data in a Reserved Namespace
    // error = ltx.parse('<error code=\'406\' type=\'modify\'><not-acceptable xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>');

};

module.exports = PrivateXMLStorage;