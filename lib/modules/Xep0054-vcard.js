'use strict';

var ltx = require('ltx'),
    util = require('util'),
    winston = require('winston'),
    logger = winston.loggers.get('module'),
    JID = require('node-xmpp-core').JID,
    XepModule = require('../core/XepModule');

/*
 * XEP-0054: vcard-temp
 * http://xmpp.org/extensions/xep-0054.html
 *
 * This implementation handles 3 types of use cases
 * - Retrieving One's vCard
 * - Updating One's vCard
 * - Viewing Another User's vCard
 */
function VCard() {
    XepModule.call(this);
}
util.inherits(VCard, XepModule);

VCard.prototype.name = 'XEP-0054: vcard-temp';

VCard.prototype.version = '0.1.0';

var NS_VCARD = 'vcard-temp';

VCard.prototype.set = function (user, vcard, callback) {
    callback(new Error('not implemented yet'), null);
};

VCard.prototype.get = function (user, callback) {
    callback(new Error('not implemented yet'), null);
};

/**
 * vCard Retrieval Request (own)
 * <iq from='stpeter@jabber.org/roundabout'
 *     id='v1'
 *     type='get'>
 *   <vCard xmlns='vcard-temp'/>
 * </iq>
 *
 * vCard Update
 * <iq id='v2' type='set'>
 *   <vCard xmlns='vcard-temp'>
 *      VCARD GOES HERE
 *   </vCard>
 * </iq>
 *
 * Retrieve anothers vcard
 * <iq from='stpeter@jabber.org/roundabout'
 *     id='v3'
 *     to='jer@jabber.org'
 *     type='get'>
 *   <vCard xmlns='vcard-temp'/>
 * </iq>
 */
VCard.prototype.match = function (stanza) {
    var result = false;

    // vCard Retrieval Request
    if (stanza.is('iq') && stanza.attrs.type === 'get' && (stanza.getChild('vcard', NS_VCARD))) {
        logger.debug('detected vcard get request');
        result = true;
    }

    // vCard Set Request
    if (stanza.is('iq') && stanza.attrs.type === 'set' && (stanza.getChild('vcard', NS_VCARD))) {
        logger.debug('detected vcard set request');
        result = true;
    }

    return result;
};

/**
 * Server Returns vCard
 * <iq id='v1'
 *     to='stpeter@jabber.org/roundabout'
 *     type='result'>
 *   <vCard xmlns='vcard-temp'>
 *     VCARD GOES HERE
 *   </vCard>
 * </iq>
 *
 * No vCard (empty element)
 * <iq id='v1'
 *     to='stpeter@jabber.org/roundabout'
 *     type='result'>
 *   <vCard xmlns='vcard-temp'/>
 * </iq>
 *
 * Return on vCard update
 * <iq id='v2'
 *     to='stpeter@jabber.org/roundabout'
 *     type='result'/>
 * or in case of an error
 * <iq id='v2'
 *     to='stpeter@jabber.org/roundabout'
 *     type='error'>
 *   <error type='auth'>
 *     <forbidden xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
 *   </error>
 * </iq>
 *
 *
 */
VCard.prototype.handle = function (stanza) {
    var self = this;

    // handle a vcard request
    if (stanza.is('iq') && stanza.attrs.type === 'get' && (stanza.getChild('vcard', NS_VCARD))) {

        // handle request to own user
        if ((stanza.attrs.to === null) || (new JID(stanza.attrs.from).equals(stanza.attrs.to))) {

            this.get(stanza.attrs.from, function (err, data) {
                self.sendVCard(err, stanza, data);
            });
        }
        // handle request of other users
        else {

            this.get(stanza.attrs.to, function (err, data) {
                self.sendVCard(err, stanza,  data);
            });
        }
    }

    // set new vcard
    if (stanza.is('iq') && stanza.attrs.type === 'set' && (stanza.getChild('vcard', NS_VCARD))) {

        var vcard = stanza.getChild('vcard', NS_VCARD).getText();

        this.set(stanza.attrs.from, vcard, function (err, data) {

            if (err) {
                var error = new ltx.Element('iq', {
                    from: stanza.attrs.to,
                    to: stanza.attrs.from,
                    id: stanza.attrs.id,
                    type: 'error'
                });

                error
                    .c('error', {
                        type: 'auth'
                    })
                    .c('forbidden', {
                        xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'
                    });

                self.send(error);
            } else {
                var success = new ltx.Element('iq', {
                    from: stanza.attrs.to,
                    to: stanza.attrs.from,
                    id: stanza.attrs.id,
                    type: 'result'
                });
                // TODO return vcard
                logger.debug(data);
                self.send(success);
            }
        });
    }
};

VCard.prototype.sendVCard = function (err, stanza, data) {
    var vcard = new ltx.Element('iq', {
        from: stanza.attrs.to,
        to: stanza.attrs.from,
        id: stanza.attrs.id,
        type: 'result'
    });

    var item = vcard
        .c('vCard', {
            xmlns: NS_VCARD
        });

    if (!err) {
        item.t(data);
    }

    this.send(vcard);
};

module.exports = VCard;