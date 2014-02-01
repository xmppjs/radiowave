'use strict';

var util = require('util'),
    ltx = require('ltx'),
    XepComponent = require('../../XepComponent'),
    Iq = require('node-xmpp-core').Stanza.Iq,
    NS = require('../namespace');

function AffiliationHandler() {}

util.inherits(AffiliationHandler, XepComponent);

AffiliationHandler.prototype.list = function (room, stanza, affiliation) {

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

    // iterate over each member

    // foreach item:
    var item = new ltx.Element('item', {
        'affiliation': affiliation,
        'jid': stanza.attrs.from,
        id: stanza.attrs.id,
        type: 'result'
    }).c('reason').t('Treason').up();
    query.cnode(item);
    this.send(iq);

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