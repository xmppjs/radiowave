'use strict';

var ltx = require('ltx'),
    util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0045'),
    uuid = require('node-uuid'),
    Router = require('../../../core/Router');

var NS_MUC_UNIQUE = 'http://jabber.org/protocol/muc#unique';

/*
 * XEP-0307: Unique Room Names for Multi-User Chat
 * http://xmpp.org/extensions/xep-0307.html
 *
 */
function MucUnique() {
    Router.call(this);
}

util.inherits(MucUnique, Router);


MucUnique.prototype.match = function (stanza) {
    if (stanza.is('iq') && stanza.attrs.type === 'get' && (stanza.getChild('unique', NS_MUC_UNIQUE))) {
        logger.debug('detected XEP-0307 request');
        return true;
    }
    return false;
};

/**
 * @description Entity Requests Unique Room Name
 * @param stanza full pubsub message stanza
 * @see http://xmpp.org/extensions/xep-0307.html
 * 
 * <iq from='crone1@shakespeare.lit/desktop'
 *     id='unique1'
 *     to='chat.shakespeare.lit'
 *     type='get'>
 *   <unique xmlns='http://jabber.org/protocol/muc#unique'/>
 * </iq>
 *
 * <iq from='chat.shakespeare.lit'
 *     id='unique1'
 *     to='crone1@shakespeare.lit/desktop'
 *     type='result'>
 *   <unique xmlns='http://jabber.org/protocol/muc#unique'>
 *     6d9423a55f499b29ad20bf7b2bdea4f4b885ead1
 *   </unique>
 * </iq>
 */
MucUnique.prototype.handle = function (stanza) {
    // stanza is already verified

    var msg = new ltx.Element('iq', {
        from: stanza.attrs.to,
        to: stanza.attrs.from,
        id: stanza.attrs.id,
        type: 'result'
    });
    var id = uuid.v4().toString();

    // TODO verify the id does not exist in our database
    msg.c('unique', {xmlns : NS_MUC_UNIQUE }).t(id);

    this.send(msg);
};

module.exports = MucUnique;