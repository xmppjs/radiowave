'use strict';

var JID = require('node-xmpp-core').JID,
  ltx = require('ltx');

module.exports = {

  Error: {
    NotFound: ltx.parse('<error type=\'cancel\'><item-not-found xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/></error>'), // jshint ignore:line
    NotSubscribed: ltx.parse('<error type=\'cancel\'><unexpected-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><not-subscribed xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>'), // jshint ignore:line
    BadRequest: ltx.parse('<error type=\'modify\'><bad-request xmlns=\'urn:ietf:params:xml:ns:xmpp-stanzas\'/><invalid-jid xmlns=\'http://jabber.org/protocol/pubsub#errors\'/></error>'), // jshint ignore:line
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

  findChannel: function (storage, channelname, owner, autocreate, dboptions) {
    autocreate = autocreate || false;
    if (autocreate) {
      return storage.findOrCreateChannel(channelname, owner, dboptions);
    } else {
      return storage.findChannel(channelname, dboptions);
    }
  }
};