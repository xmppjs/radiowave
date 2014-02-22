'use strict';

var util = require('util'),
    ltx = require('ltx'),
    winston = require('winston'),
    logger = winston.loggers.get('xep-0045'),
    Promise = require('bluebird'),
    XepComponent = require('../../XepComponent'),
    Iq = require('node-xmpp-core').Stanza.Iq,
    NS = require('../namespace');

function AffiliationHandler() {}

util.inherits(AffiliationHandler, XepComponent);

AffiliationHandler.prototype.list = function (room, stanza, affiliation) {
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

module.exports = AffiliationHandler;