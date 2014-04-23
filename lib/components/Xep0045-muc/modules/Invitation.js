'use strict';

var util = require('util'),
    XModule = require('../../../core/XModule'),
    NS = require('../namespace'),
    logger = require('../../../core/Logger')('xep-0045'),
    JID = require('node-xmpp-core').JID,
    Message = require('node-xmpp-core').Stanza.Message,
    mucutil = require('../Util');

/**
 * Implements the mediated invite
 * @see http://xmpp.org/extensions/xep-0045.html#invite-mediated
 */
function Invitation(storage) {
    XModule.call(this);
    this.storage = storage;
}

util.inherits(Invitation, XModule);

Invitation.prototype.name = 'XEP-0045: Invitation';

Invitation.prototype.match = function (stanza) {
    // mediated invitation
    return (stanza.is('message') && (stanza.getChild('x', NS.MUC_USER) && stanza.getChild('x', NS.MUC_USER).getChild('invite'))) ||
    (stanza.is('message') && (stanza.getChild('x', NS.MUC_USER) && stanza.getChild('x', NS.MUC_USER).getChild('decline')));
};

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
Invitation.prototype.invite = function (room, user, stanza, x) {

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
Invitation.prototype.declinedInvitation = function (room, stanza, x) {

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

/*
 * Implement 7.8
 * @see http://xmpp.org/extensions/xep-0045.html#invite
 */
Invitation.prototype.handleInvitations = function (stanza, x) {
    logger.debug('handle invitations');
    var self = this;

    var userjid = stanza.attrs.to;
    var roomname = mucutil.determineRoomname(stanza);

    var user = null;
    var room = null;

    // find user (may not be a member of the room)
    this.storage.findUser(mucutil.getBareJid(userjid)).then(function (u) {
        logger.debug('found user');
        user = u;
        // find a room
        return self.storage.findRoom(roomname);
    }).then(function (r) {
        room = r;
        logger.debug('found room');
        room.isMember(user).then(function ()  {
            logger.error('cannot invite because the user is already a member');
        }).
        catch (function (err) {
            // user should not be a member already
            self.invite(room, user, stanza, x);
        });
    }).
    catch (function (err) {
        logger.error(err);
        self.sendError(stanza);
    });

    return true;
};

Invitation.prototype.handleDeclinedInvitations = function (stanza, x) {
    logger.debug('handle declined invitations');
    var self = this;

    var userjid = stanza.attrs.from;
    var roomname = mucutil.determineRoomname(stanza);

    this.findRoom(roomname).then(
        function (room) {
            self.declinedInvitation(room, stanza, x);
        }).
    catch (function (err) {
        logger.error(err);
        self.sendError(stanza);
    });

    return true;
};

Invitation.prototype.handle = function (stanza) {
    var handled = false;

    var msg = stanza.is('message');
    var x = stanza.getChild('x', NS.MUC_USER);

    // handle invitations
    if (msg && x && x.getChild('invite')) {
        handled = this.handleInvitations(stanza, x);
    }
    // handle invitation declines
    else if (msg && x && x.getChild('decline')) {
        handled = this.handleDeclinedInvitations(stanza, x);
    }

    return handled;
};

module.exports = Invitation;