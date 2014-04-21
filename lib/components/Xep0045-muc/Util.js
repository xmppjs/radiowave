'use strict';

var JID = require('node-xmpp-core').JID,
    ltx = require('ltx');

module.exports = {

    Error : {
        NotFound : ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>')
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

    determineRoomname: function (stanza) {
        var roomjid = new JID(stanza.attrs.to);
        return roomjid.getLocal();
    }
};