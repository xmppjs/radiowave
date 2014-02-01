'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0045'),
    XepComponent = require('../../XepComponent'),
    Message = require('node-xmpp-core').Stanza.Message,
    JID = require('node-xmpp-core').JID,
    NS = require('../namespace');

function InvitationHandler() {}

util.inherits(InvitationHandler, XepComponent);

/*
 * Implement 7.8
 * @see http://xmpp.org/extensions/xep-0045.html
 * <message
 *     from=’crone1@shakespeare.lit/desktop’
 *     id=’nzd143v8’
 *     to=’coven@chat.shakespeare.lit’>
 *     <x xmlns=’http://jabber.org/protocol/muc#user’>
 *         <invite to=’hecate@shakespeare.lit’>
 *             <reason>
 *             Hey Hecate, this is the place for all good witches!
 *             </reason>
 *         </invite>
 *     </x>
 * </message>
 */
InvitationHandler.prototype.invite = function (room, stanza, x) {
    var roomjid = new JID(stanza.attrs.to);
    var from = new JID(stanza.attrs.from);

    // extract reason
    var invite = x.getChild('invite');
    var member = x.attrs.to;
    var reason = invite.getChild('reason');

    // password

    // send client the confirmation
    var confirmMsg = new Message({
        from: roomjid.toString(),
        to: member
    });
    var xEl = confirmMsg.c('x', {
        'xmlns': NS.MUC_USER
    });
    var inviteEl = xEl.c('invite', {
        'from': from
    });
    inviteEl.cnode(reason);

    this.send(confirmMsg);
};

module.exports = InvitationHandler;