'use strict';

var util = require('util'),
    XModule = require('../../../core/XModule'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0045'),
    ltx = require('ltx'),
    Iq = require('node-xmpp-core').Stanza.Iq,
    NS = require('../namespace'),
    mucutil = require('../Util');


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

    // read all affiliations
    room.listAffiliations(affiliation)
        .then(function (affiliations) {
            logger.debug('got here' + JSON.stringify(affiliations));

            // iterate over items and send them to the client
            affiliations.forEach(function(item){
                logger.debug(item);
                var itemEl = new ltx.Element('item', {
                    'affiliation': item.affiliation.type,
                    'jid': item.jid
                });

                // if we found a reason
                if (item.affiliation && item.affiliation.reason) {
                    itemEl.c('reason').t(item.affiliation.reason);
                }

                // add item
                query.cnode(itemEl);
            });

            self.send(iq);
        }).
    catch (function (err) {
        logger.error(err);
        self.sendError(stanza);
    });


    /*
    <iq from='southampton@chat.shakespeare.lit'
              id='ban2'
              to='kinghenryv@shakespeare.lit/throne'
              type='result'>
            <query xmlns='http://jabber.org/protocol/muc#admin'>
              <item affiliation='outcast'
                    jid='earlofcambridge@shakespeare.lit'>
                <reason>Treason</reason>
              </item>
            </query>
          </iq>
    */
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
        method = 'affiliationlist';
    }

    if (method) {
        var roomname = mucutil.determineRoomname(stanza);

        storage.findRoom(roomname).then(
            function (room) {
                logger.debug('found room: ' + JSON.stringify(room) + ' and ' + method);

                switch (method) {
                case 'affiliationlist':
                    this.list(room, stanza, item.attrs.affiliation);
                    break;
                }
            })
            .
        catch (function (err) {
            logger.error(err);
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