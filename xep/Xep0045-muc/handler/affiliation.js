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

AffiliationHandler.prototype.setOwner = function (room, userjid) {
    logger.debug('set owner ' + userjid);
    return new Promise(function (resolve, reject) {
        room.editAffiliation(userjid, {
            'type': NS.MUC_AFFILIATION_OWNER,
            'reason': 'Created the room.'
        }).then(function () {
            return room.editRole(userjid, {
                'type': NS.MUC_ROLE_MODERATOR
            });
        }).then (function() {
            resolve();
        }).catch(function(err){
            reject(err);
        });
    });
};

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
    room.listAffiliations(affiliation).then(function (affiliations) {
        // foreach item:
        var item = new ltx.Element('item', {
            'affiliation': affiliation,
            'jid': stanza.attrs.from,
            id: stanza.attrs.id,
            type: 'result'
        }).c('reason').t('Treason').up();
        query.cnode(item);
        this.send(iq);

    }).
    catch (function () {
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