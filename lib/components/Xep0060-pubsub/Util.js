'use strict';

var JID = require('node-xmpp-core').JID,
    ltx = require('ltx');

module.exports = {

    Error: {
        NotFound: ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>'),
        NotSubscribed: ltx.parse('<error type=\'cancel\'><unexpected-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><not-subscribed xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>'),
        BadRequest: ltx.parse('<error type=\'modify\'><bad-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><invalid-jid xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>'),
        Conflict: ltx.parse('<error type=\'cancel\'><conflict xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>')
    },

    getBareJid: function (jid) {
        var userjid = null;
        if (jid instanceof JID) {
            userjid = jid;
        } else {
            userjid = new JID(jid.toString());
        }

        return userjid.bare().toString();
    },

    findChannel: function (storage, channelname, user, autocreate) {
        autocreate = autocreate || false;
        console.log('search for node: ' + channelname);
        if (autocreate) {
            console.log('activate auto-create');
            return storage.findOrCreateChannel(channelname, user);
        } else {
            console.log('just find this node');
            return storage.findChannel(channelname);
        }
    }
};