'use strict';

var Promise = require('bluebird'),
    ltx = require('ltx'),
    assert = require('assert'),
    should = require('should'),
    helper = require('../_helper/helper'),
    muc_helper = require('../_helper/muc');

var Xep0045 = require('../../lib/components/Xep0045-muc');

function configureXEP(server) {
    // register pubsub component
    server.cr.register(new Xep0045({
        subdomain: 'chat',
        domain: 'example.net',
        storage: server.storage
    }));
}

/**
 * @see http://xmpp.org/extensions/xep-0045.html#admin
 */
describe('Xep-0060', function () {
    describe('9. Admin Use Cases', function () {

        var room = 'julia_room_01@chat.example.net';
        var nick = 'julia';
        var srv = null;

        before(function (done) {
            helper.startServer()
            // configure muc module
            .then(function (server) {
                srv = server;
                configureXEP(server);
                done();
            })
                .
            catch (function (err) {
                done(err);
            });
        });

        after(function (done) {
            srv.xR.shutdown();
            done();
        });

        it('Precondition: create room', function (done) {
            muc_helper.juliaCreateRoom(room, nick, done);
        });

        /*
         * Example 110. Admin Bans User
         * <iq from='kinghenryv@shakespeare.lit/throne'
         *     id='ban1'
         *     to='southampton@chat.shakespeare.lit'
         *     type='set'>
         *   <query xmlns='http://jabber.org/protocol/muc#admin'>
         *     <item affiliation='outcast'
         *           jid='earlofcambridge@shakespeare.lit'/>
         *   </query>
         * </iq>
         *
         * Service Informs Admin or Owner of Success
         * <iq from='southampton@chat.shakespeare.lit'
         *     id='ban1'
         *     to='kinghenryv@shakespeare.lit/throne'
         *     type='result'/>
         *
         * Service Removes Banned User
         * <presence
         *     from='southampton@chat.shakespeare.lit/cambridge'
         *     to='earlofcambridge@shakespeare.lit/stabber'
         *     type='unavailable'>
         *   <x xmlns='http://jabber.org/protocol/muc#user'>
         *     <item affiliation='outcast' role='none'>
         *       <actor nick='The ♚'/>
         *       <reason>Treason</reason>
         *     </item>
         *     <status code='301'/>
         *   </x>
         * </presence>
         *
         * Service Informs Remaining Occupants
         * <presence
         *     type='unavailable'
         *     from='southampton@chat.shakespeare.lit/cambridge'
         *     to='exeter@shakespeare.lit/pda'>
         *   <x xmlns='http://jabber.org/protocol/muc#user'>
         *     <item affiliation='outcast'
         *           jid='earlofcambridge@shakespeare.lit/stabber'
         *           role='none'/>
         *     <status code='301'/>
         *   </x>
         * </presence>
         */
        it('9.1 Banning a User', function (done) {
            done();
        });

        /*
         *
         * Admin Bans User (With a Reason)
         * <iq from='kinghenryv@shakespeare.lit/throne'
         *     id='ban1'
         *     to='southampton@chat.shakespeare.lit'
         *     type='set'>
         *   <query xmlns='http://jabber.org/protocol/muc#admin'>
         *     <item affiliation='outcast'
         *           jid='earlofcambridge@shakespeare.lit'>
         *       <reason>Treason</reason>
         *     </item>
         *   </query>
         * </iq>
         */
        it('9.1 Banning a User', function (done) {
            done();
        });

        /*
         * Service Returns Error on Attempt to Ban User With Higher Affiliation
         * <iq from='kinghenryv@shakespeare.lit/throne'
         *     id='ban1'
         *     to='southampton@chat.shakespeare.lit'
         *     type='set'>
         *   <error type='cancel'>
         *     <not-allowed xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
         *   </error>
         * </iq>
         */
        it('9.1 Banning a User', function (done) {
            done();
        });

        /*
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
        it('9.2 Admin Requests Ban List', function (done) {

            var nickjid = room + '/' + nick;

            var msg =
            "<iq id='ban2' type='get'> \
                <query xmlns='http://jabber.org/protocol/muc#admin'> \
                  <item affiliation='outcast'/> \
                </query> \
            </iq>";

            var stanza = ltx.parse(msg);
            stanza.attrs.from = helper.userJulia.jid;
            stanza.attrs.to = nickjid;

            // start clients
            helper.sendMessageWithJulia(stanza.root()).then(function (stanza) {
                try {
                    assert.equal(stanza.attrs.type, 'result');
                    done();
                } catch (err) {
                    done(err);
                }
            }).
            catch (function (err) {
                done(err);
            });
        });

        /*
         *
         * Admin Sends Modified Ban List to Service
         * <iq from='kinghenryv@shakespeare.lit/throne'
         *     id='ban3'
         *     to='southampton@chat.shakespeare.lit'
         *     type='set'>
         *   <query xmlns='http://jabber.org/protocol/muc#admin'>
         *     <item affiliation='outcast'
         *           jid='lordscroop@shakespeare.lit'>
         *       <reason>Treason</reason>
         *     </item>
         *     <item affiliation='outcast'
         *           jid='sirthomasgrey@shakespeare.lit'>
         *       <reason>Treason</reason>
         *     </item>
         *   </query>
         * </iq>
         *
         * Service Informs Admin of Success
         * <iq from='southampton@chat.shakespeare.lit'
         *     id='ban3'
         *     to='kinghenryv@shakespeare.lit/throne'
         *     type='result'/>
         */
        it('9.2 Modifying the Ban List', function (done) {
            done();
        });

        /*
         *
         * Admin Grants Membership
         * <iq from='crone1@shakespeare.lit/desktop'
         *     id='member1'
         *     to='coven@chat.shakespeare.lit'
         *     type='set'>
         *   <query xmlns='http://jabber.org/protocol/muc#admin'>
         *     <item affiliation='member'
         *           jid='hag66@shakespeare.lit'
         *           nick='thirdwitch'/>
         *   </query>
         * </iq>
         *
         * Service Informs Admin of Success
         * <iq from='coven@chat.shakespeare.lit'
         *     id='member1'
         *     to='crone1@shakespeare.lit/desktop'
         *     type='result'/>
         *
         * Service Sends Notice of Membership to All Occupants
         * <presence
         *     from='coven@chat.shakespeare.lit/thirdwitch'
         *     to='crone1@shakespeare.lit/desktop'>
         *   <x xmlns='http://jabber.org/protocol/muc#user'>
         *     <item affiliation='member'
         *           jid='hag66@shakespeare.lit/pda'
         *           role='participant'
         *           nick='thirdwitch'/>
         *   </x>
         * </presence>
         */

        it('9.3 Granting Membership', function (done) {
            done();
        });

        /*
         *
         * <iq from='crone1@shakespeare.lit/desktop'
         *     id='member1'
         *     to='coven@chat.shakespeare.lit'
         *     type='set'>
         *   <query xmlns='http://jabber.org/protocol/muc#admin'>
         *     <item affiliation='member'
         *           jid='hag66@shakespeare.lit'
         *           nick='thirdwitch'>
         *       <reason>A worthy witch indeed!</reason>
         *     </item>
         *   </query>
         * </iq>
         */
        it('9.3 Granting Membership', function (done) {
            done();
        });

        /*
         *
         *
         * Admin Revokes Membership
         * <iq from='crone1@shakespeare.lit/desktop'
         *     id='member2'
         *     to='coven@chat.shakespeare.lit'
         *     type='set'>
         *   <query xmlns='http://jabber.org/protocol/muc#admin'>
         *     <item affiliation='none'
         *           jid='hag66@shakespeare.lit'/>
         *   </query>
         * </iq>
         *
         * Service Informs Moderator of Success
         * <iq from='coven@chat.shakespeare.lit'
         *     id='member2'
         *     to='crone1@shakespeare.lit/desktop'
         *     type='result'/>
         *
         * Service Notes Loss of Membership
         * <presence
         *     from='coven@chat.shakespeare.lit/thirdwitch'
         *     to='crone1@shakespeare.lit/desktop'>
         *   <x xmlns='http://jabber.org/protocol/muc#user'>
         *     <item affiliation='none'
         *           jid='hag66@shakespeare.lit/pda'
         *           role='participant'/>
         *   </x>
         * </presence>
         *
         * Service Removes Non-Member
         * <presence
         *     from='coven@chat.shakespeare.lit/thirdwitch'
         *     to='crone1@shakespeare.lit/desktop'>
         *     type='unavailable'>
         *   <x xmlns='http://jabber.org/protocol/muc#user'>
         *     <item affiliation='none' role='none'>
         *       <actor nick='TheBard'/>
         *     </item>
         *     <status code='321'/>
         *   </x>
         * </presence>
         */
        it('9.4 Revoking Membership', function (done) {
            done();
        });

        /*
         *
         *
         * Admin Requests Member List
         * <iq from='crone1@shakespeare.lit/desktop'
         *     id='member3'
         *     to='coven@chat.shakespeare.lit'
         *     type='get'>
         *   <query xmlns='http://jabber.org/protocol/muc#admin'>
         *     <item affiliation='member'/>
         *   </query>
         * </iq>
         *
         * Service Sends Member List to Admin
         * <iq from='coven@chat.shakespeare.lit'
         *     id='member3'
         *     to='crone1@shakespeare.lit/desktop'
         *     type='result'>
         *   <query xmlns='http://jabber.org/protocol/muc#admin'>
         *     <item affiliation='member'
         *           jid='hag66@shakespeare.lit'
         *           nick='thirdwitch'
         *           role='participant'/>
         *   </query>
         * </iq>
         *
         */
        it('9.5 Modifying the Member List', function (done) {
            done();
        });

    });
});