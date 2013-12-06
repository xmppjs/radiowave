'use strict';

var winston = require('winston'),
    logger = winston.loggers.get('xrocket');

var JID = require('node-xmpp-core').JID;

var XmppVerify = function () {};

XmppVerify.prototype = {

    /**
     * check for http://tools.ietf.org/html/rfc3920#section-4.7.3 <invalid-from/>
     *
     * @param  node-xmpp stream
     * @param  node-xmpp xml stanza
     * @return xmpp error type
     */
    invalidfrom: function (stream, stanza) {
        var fromJID = new JID(stanza.attrs.from);
        var streamJID = stream.jid;

        logger.debug('verify sender JID ' + fromJID + ' with stream JID ' + streamJID);

        if (!streamJID.equals(fromJID)) {
            logger.error('verify of JIDs failed');
            return 'invalid-from';
        } else {
            return null;
        }
    }
};

module.exports = new XmppVerify();