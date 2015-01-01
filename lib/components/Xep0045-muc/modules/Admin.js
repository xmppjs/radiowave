'use strict';

var util = require('util'),
  XModule = require('../../../core/XModule'),
  ltx = require('ltx'),
  Iq = require('node-xmpp-core').Stanza.Iq,
  NS = require('../namespace'),
  mucutil = require('../Util'),
  logger = require('../../../core/Logger')('xep-0045:admin');


function Admin(storage) {
  XModule.call(this);
  this.storage = storage;
}

util.inherits(Admin, XModule);

Admin.prototype.name = 'XEP-0045: Admin';

Admin.prototype.match = function (stanza) {
  // membership
  return (stanza.is('iq') && stanza.getChild('query', NS.MUC_ADMIN));
};

/**
 * returs the affiliations for each members of the room
 *
 * <iq from='kinghenryv@shakespeare.lit/throne'
 *     id='ban2'
 *     to='southampton@chat.shakespeare.lit'
 *     type='get'>
 *   <query xmlns='http://jabber.org/protocol/muc#admin'>
 *     <item affiliation='outcast'/>
 *   </query>
 * </iq>
 *
 * <iq from='southampton@chat.shakespeare.lit'
 *     id='ban2'
 *     to='kinghenryv@shakespeare.lit/throne'
 *     type='result'>
 *   <query xmlns='http://jabber.org/protocol/muc#admin'>
 *     <item affiliation='outcast'
 *           jid='earlofcambridge@shakespeare.lit'>
 *       <reason>Treason</reason>
 *     </item>
 *   </query>
 * </iq>
 */
Admin.prototype.list = function (room, stanza, affiliation) {
  var self = this;

  var iq = new Iq({
    from: stanza.attrs.to,
    to: stanza.attrs.from,
    id: stanza.attrs.id,
    type: 'result'
  });

  var query = new ltx.Element('query', {
    'xmlns': NS.MUC_ADMIN,
    'to': stanza.attrs.from,
    'id': stanza.attrs.id,
    'type': 'result'
  });
  iq.cnode(query);

  var affiliationSet = [];

  switch (affiliation) {
  case NS.MUC_AFFILIATION_ADMIN:
    affiliationSet.push(this.storage.RoomMember.Affiliation.Admin);
    break;
  case NS.MUC_AFFILIATION_MEMBER:
    affiliationSet.push(this.storage.RoomMember.Affiliation.Member);
    break;
  case NS.MUC_AFFILIATION_OWNER:
    affiliationSet.push(this.storage.RoomMember.Affiliation.Owner);
    break;
  case NS.MUC_AFFILIATION_OUTCAST:
    affiliationSet.push(this.storage.RoomMember.Affiliation.Outcast);
    break;
  }

  // checkout if the current user is member
  room.getMembers({
    where: {
      affiliation: affiliationSet
    }
  }).then(function (members) {

    logger.debug('members with affiliation ' + affiliation + ': ' + JSON.stringify(members));

    // iterate over items and send them to the client
    members.forEach(function (member) {
      logger.debug(member);
      var itemEl = new ltx.Element('item', {
        'affiliation': member.RoomMember.affiliation,
        'jid': member.jid
      });

      // if we found a reason
      /*if (item.affiliation && item.affiliation.reason) {
          itemEl.c('reason').t(item.affiliation.reason);
      }*/

      // add item
      query.cnode(itemEl);
    });

    self.send(iq);
  }).catch(function (err) {
    logger.error(err);
    self.sendError(stanza);
  });
};

Admin.prototype.handleAdminRequests = function (stanza) {
  logger.debug('handleAdminRequests');
  var self = this;
  var storage = this.storage;

  // determine type of request
  var method = null;

  var query = stanza.getChild('query', NS.MUC_ADMIN);
  var item = query.getChild('item');

  if (item && (
      (item.attrs.affiliation === NS.MUC_AFFILIATION_ADMIN) ||
      (item.attrs.affiliation === NS.MUC_AFFILIATION_MEMBER) ||
      (item.attrs.affiliation === NS.MUC_AFFILIATION_OWNER) ||
      (item.attrs.affiliation === NS.MUC_AFFILIATION_OUTCAST)
    )) {

    // get room name
    var roomname = mucutil.determineRoomname(stanza);

    storage.findRoom(roomname).then(
        function (room) {
          logger.debug('found room: ' + JSON.stringify(room) + ' and ' + method);
          self.list(room, stanza, item.attrs.affiliation);
        })
      .
    catch(function (err) {
      logger.error(err);
      self.sendError(stanza);
    });
  } else {
    this.sendError(stanza);
  }

  return true;
};

Admin.prototype.handle = function (stanza) {
  var handled = false;

  // admin request
  if (stanza.is('iq') && stanza.getChild('query', NS.MUC_ADMIN)) {
    handled = this.handleAdminRequests(stanza);
  }

  return handled;
};

module.exports = Admin;
