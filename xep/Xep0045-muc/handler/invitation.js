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
 *
 * <message
 *     from='coven@chat.shakespeare.lit'
 *     id='nzd143v8'
 *     to='hecate@shakespeare.lit'>
 *   <x xmlns='http://jabber.org/protocol/muc#user'>
 *     <invite from='crone1@shakespeare.lit/desktop'>
 *       <reason>
 *         Hey Hecate, this is the place for all good witches!
 *       </reason>
 *     </invite>
 *     <password>cauldronburn</password>
 *   </x>
 * </message>
 */
InvitationHandler.prototype.invite = function (room, stanza, x) {

    // extract content
    var roomjid = new JID(stanza.attrs.to);
    var from = new JID(stanza.attrs.from);

    var invite = x.getChild('invite');
    var invitee = invite.attrs.to;
    var reason = invite.getChild('reason');

    logger.debug('send invite for ' + roomjid.toString() + ' to ' + invitee + ' with reason: ' + reason.text().trim());

    // Sends Invitation to Invitee on Behalf of Invitor
    var invitation = new Message({
        from: roomjid.toString(),
        to: invitee
    });
    var xEl = invitation.c('x', {
        'xmlns': NS.MUC_USER
    });
    var inviteEl = xEl.c('invite', {
        'from': from
    });
    inviteEl.cnode(reason);

    // TODO add room password if there
    // inviteEl.c('password').t('roompassword');

    this.send(invitation);

};

/*
 * Invitee Declines Invitation
 * 
 * <message
 *     from='hecate@shakespeare.lit/broom'
 *     id='jk2vs61v'
 *     to='coven@chat.shakespeare.lit'>
 *   <x xmlns='http://jabber.org/protocol/muc#user'>
 *     <decline to='crone1@shakespeare.lit'>
 *       <reason>
 *         Sorry, I'm too busy right now.
 *       </reason>
 *     </decline>
 *   </x>
 * </message>
 *       
 * Room Informs Invitor that Invitation Was Declined
 * <message
 *     from='coven@chat.shakespeare.lit'
 *     id='jk2vs61v'
 *     to='crone1@shakespeare.lit/desktop'>
 *   <x xmlns='http://jabber.org/protocol/muc#user'>
 *     <decline from='hecate@shakespeare.lit'>
 *       <reason>
 *         Sorry, I'm too busy right now.
 *       </reason>
 *     </decline>
 *   </x>
 * </message>
 */
InvitationHandler.prototype.declinedInvitation = function (room, stanza, x) {

    // extract content
    var roomjid = new JID(stanza.attrs.to);
    var from = new JID(stanza.attrs.from);

    var decline = x.getChild('decline');
    var invitor = decline.attrs.to;
    var reason = decline.getChild('reason');

    logger.debug('got decline for ' + roomjid.toString() + ' to ' + invitor + ' with reason: ' + reason.text().trim());

    // Room Informs Invitor that Invitation Was Declined

    var invitation = new Message({
        from: roomjid.toString(),
        to: invitor
    });
    var xEl = invitation.c('x', {
        'xmlns': NS.MUC_USER
    });
    var declineEl = xEl.c('decline', {
        'from': from
    });
    declineEl.cnode(reason);

    this.send(invitation);

};

module.exports = InvitationHandler;