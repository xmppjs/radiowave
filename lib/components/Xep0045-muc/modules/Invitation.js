'use strict';

var util = require('util'),
    XModule = require('../../../core/XModule'),
    NS = require('../namespace'),
    logger = require('../../../core/Logger')('xep-0045'),
    JID = require('node-xmpp-core').JID,
    XmppMessage = require('node-xmpp-core').Stanza.Message,
    mucutil = require('../Util');

/**
 * Implements the mediated invite
 * @see http://xmpp.org/extensions/xep-0045.html#invite-mediated
 */
function Invitation(storage, options) {
    XModule.call(this);

    this.storage = storage;
    this.options = options;

    // register for invite or decline event
    var self = this;
    this.storage.on('invite', function (event) {
        self.inviteEventHandler(event);
    });

    this.storage.on('declined', function (event) {
        self.declineEventHandler(event);
    });
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
Invitation.prototype.inviteEventHandler = function (inviteRequest) {

    var roomjid = new JID(inviteRequest.room.name + '@' + this.options.domain);
    var invitee = inviteRequest.invitee.jid;
    var inviter = inviteRequest.inviter.jid;
    var reason = inviteRequest.reason ||  "";

    logger.debug('send invite for ' + roomjid.toString() + ' to ' + invitee + ' with reason: ' + reason);

    // Sends Invitation to Invitee on Behalf of Invitor
    var invitation = new XmppMessage({
        from: roomjid.toString(),
        to: invitee
    });
    var xEl = invitation.c('x', {
        'xmlns': NS.MUC_USER
    });
    var inviteEl = xEl.c('invite', {
        'from': inviter
    }).c('reason').cnode(reason);

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
Invitation.prototype.declineEventHandler = function (inviteRequest) {

    var roomjid = new JID(inviteRequest.room.name + '@' + this.options.domain);
    var invitee = inviteRequest.invitee.jid;
    var inviter = inviteRequest.inviter.jid;
    var reason = inviteRequest.reason ||  "";

    logger.debug('got decline for ' + roomjid.toString() + ' from ' + invitee + ' with reason: ' + reason);

    // Room Informs Invitor that Invitation Was Declined

    var invitation = new XmppMessage({
        from: roomjid.toString(),
        to: inviter
    });
    var xEl = invitation.c('x', {
        'xmlns': NS.MUC_USER
    });
    var declineEl = xEl.c('decline', {
        'from': invitee
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

    var roomname = mucutil.determineRoomname(stanza);

    // requestor or inviter is owner of the room
    var jid = mucutil.getBareJid(stanza.attrs.to);

    // jid of the invitee
    var invite = x.getChild('invite');
    var inviteejid = invite.attrs.to;

    // reason
    var reason = invite.getChild('reason');
    var reasontxt = reason.text().trim();

    // check if the "member" is a known user
    var storage = this.storage;
    var invitee = null;
    var inviter = null;

    // find user (may not be a member of the room)
    storage.findOrCreateUser(mucutil.getBareJid(inviteejid)).then(function (member) {
        invitee = member;
        // check if the requestor is a known user
        return storage.findUser(jid.toString());
    }).then(function (owner) {
        inviter = owner;
        // check if the owner has such room
        return storage.getRoom(owner, roomname);
    }).then(function (room) {
        console.log('add');
        // add member to room
        return storage.inviteMember({
            room: room,
            invitee: invitee,
            inviter: inviter,
            reason: reasontxt
        });
    }).then(function () {
        // send invite stanza
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

    // var userjid = stanza.attrs.from;
    var roomname = mucutil.determineRoomname(stanza);

    // extract content
    var invitee = new JID(stanza.attrs.from);

    var decline = x.getChild('decline');
    var invitor = decline.attrs.to;
    var reason = decline.getChild('reason');
    var reasontxt = reason.text().trim();

    this.findRoom(roomname).then(
        function (room) {
            self.declinedInvitation({
                room: room,
                invitee: invitee,
                invitor: invitor,
                reason: reasontxt
            });
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