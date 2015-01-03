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
  server.cr.addComponent(new Xep0045({
    subdomain: 'chat',
    domain: 'example.net',
    storage: server.storage
  }));
}

/**
 * @see http://xmpp.org/extensions/xep-0045.html#user
 */
describe('Xep-0045', function () {
  describe('7. Occupant Use Cases', function () {

    var room = 'julia_room_01@chat.example.net';
    var nick = 'julia';
    var srv = null;

    before(function (done) {
      this.timeout(5000);
      helper.startServer()
        // configure muc module
        .then(function (server) {
          srv = server;
          configureXEP(server);
          done();
        }).catch(function (err) {
          done(err);
        });
    });

    after(function (done) {
      srv.connectionRouter.stopConnections();
      done();
    });

    it('Precondition: create room', function (done) {
      muc_helper.juliaCreateRoom(room, nick, done);
    });

    /*
     * No Nickname Specified
     * <presence
     *     from='hag66@shakespeare.lit/pda'
     *     id='n13mt3l'
     *     to='coven@chat.shakespeare.lit'>
     *   <x xmlns='http://jabber.org/protocol/muc'/>
     * </presence>
     *
     * <presence
     *     from='coven@chat.shakespeare.lit'
     *     id='273hs51g'
     *     to='hag66@shakespeare.lit/pda'
     *     type='error'>
     *   <error by='coven@chat.shakespeare.lit' type='modify'>
     *     <jid-malformed xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
     *   </error>
     * </presence>
     */
    it('No Nickname Specified', function (done) {
      done();
    });

    /*  
     * 7.2.3 Presence Broadcast
     * <presence
     *     from='hag66@shakespeare.lit/pda'
     *     id='n13mt3l'
     *     to='coven@chat.shakespeare.lit/thirdwitch'>
     *   <x xmlns='http://jabber.org/protocol/muc'/>
     * </presence>
     *
     * Service Sends Presence from Existing Occupants to New Occupant
     * <presence
     *     from='coven@chat.shakespeare.lit/firstwitch'
     *     id='3DCB0401-D7CF-4E31-BE05-EDF8D057BFBD'
     *     to='hag66@shakespeare.lit/pda'>
     *   <x xmlns='http://jabber.org/protocol/muc#user'>
     *     <item affiliation='owner' role='moderator'/>
     *   </x>
     * </presence>
     *
     * Service Sends New Occupant's Presence to All Occupants
     * <presence
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     id='27C55F89-1C6A-459A-9EB5-77690145D624'
     *     to='crone1@shakespeare.lit/desktop'>
     *   <x xmlns='http://jabber.org/protocol/muc#user'>
     *     <item affiliation='member' role='participant'/>
     *   </x>
     * </presence>
     *
     * Service Sends New Occupant's Presence to New Occupant
     * <presence
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     id='n13mt3l'
     *     to='hag66@shakespeare.lit/pda'>
     *   <x xmlns='http://jabber.org/protocol/muc#user'>
     *     <item affiliation='member' role='participant'/>
     *     <status code='110'/>
     *     <status code='210'/>
     *   </x>
     * </presence>
     */
    it('7.2.3 Presence Broadcast', function (done) {
      done();
    });

    /*
     * <presence
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     id='17232D15-134F-43C8-9A29-61C20A64B236'
     *     to='crone1@shakespeare.lit/desktop'>
     *   <x xmlns='http://jabber.org/protocol/muc#user'>
     *     <item affiliation='none'
     *           jid='hag66@shakespeare.lit/pda'
     *           role='participant'/>
     *   </x>
     * </presence>
     */
    it('7.2.4 Non-Anonymous Rooms', function (done) {
      done();
    });

    /*
     * 7.2.6 Password-Protected Rooms
     * Service Denies Access Because No Password Provided
     * <presence
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     id='n13mt3l'
     *     to='hag66@shakespeare.lit/pda'
     *     type='error'>
     *   <x xmlns='http://jabber.org/protocol/muc'/>
     *   <error by='coven@chat.shakespeare.lit' type='auth'>
     *     <not-authorized xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
     *   </error>
     * </presence>
     */
    it('7.2.6 Service Denies Access Because No Password Provided', function (done) {
      done();
    });

    /*
     * <presence
     *     from='hag66@shakespeare.lit/pda'
     *     id='djn4714'
     *     to='coven@chat.shakespeare.lit/thirdwitch'>
     *   <x xmlns='http://jabber.org/protocol/muc'>
     *     <password>cauldronburn</password>
     *   </x>
     * </presence>
     */
    it('7.2.6 User Provides Password On Entering a Room', function (done) {
      done();
    });

    /* 
     * <presence
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     id='n13mt3l'
     *     to='hag66@shakespeare.lit/pda'
     *     type='error'>
     *    <x xmlns='http://jabber.org/protocol/muc'/>
     *    <error by='coven@chat.shakespeare.lit' type='auth' >
     *       <registration-required xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
     *    </error>
     * </presence>
     */
    it('7.2.7 Members-Only Rooms', function (done) {
      done();
    });

    /*
     * <presence
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     id='n13mt3l'
     *     to='hag66@shakespeare.lit/pda'
     *     type='error'>
     *   <x xmlns='http://jabber.org/protocol/muc'/>
     *   <error by='coven@chat.shakespeare.lit' type='auth'>
     *     <forbidden xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
     *   </error>
     * </presence>
     */
    it('7.2.8 Banned Users', function (done) {
      done();
    });

    /*
     * <presence
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     id='n13mt3l'
     *     to='hag66@shakespeare.lit/pda'
     *     type='error'>
     *   <x xmlns='http://jabber.org/protocol/muc'/>
     *   <error by='coven@chat.shakespeare.lit' type='cancel'>
     *     <conflict xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
     *   </error>
     * </presence>
     */
    it('7.2.9 Nickname Conflict', function (done) {
      done();
    });

    /*
     * <presence
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     id='n13mt3l'
     *     to='hag66@shakespeare.lit/pda'
     *     type='error'>
     *   <x xmlns='http://jabber.org/protocol/muc'/>
     *   <error by='coven@chat.shakespeare.lit' type='cancel'>
     *     <item-not-found xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
     *   </error>
     * </presence>
     */
    it('7.2.11 Locked Room', function (done) {
      done();
    });

    it('7.2.12 Nonexistent Room', function (done) {
      done();
    });

    /*
     * <presence
     *     from='hag66@shakespeare.lit/pda'
     *     id='n13mt3l'
     *     to='coven@chat.shakespeare.lit/thirdwitch'>
     *   <x xmlns='http://jabber.org/protocol/muc'>
     *     <history maxchars='65000'/>
     *   </x>
     * </presence>
     */
    it('7.2.15 User Requests Limit on Number of Characters in History', function (done) {
      done();
    });

    /*
     * <presence
     *     from='hag66@shakespeare.lit/pda'
     *     id='n13mt3l'
     *     to='coven@chat.shakespeare.lit/thirdwitch'>
     *   <x xmlns='http://jabber.org/protocol/muc'>
     *     <history maxstanzas='20'/>
     *   </x>
     * </presence>
     */
    it('7.2.15 User Requests Limit on Number of Messages in History', function (done) {
      done();
    });

    /*
     * <presence
     *     from='hag66@shakespeare.lit/pda'
     *     id='n13mt3l'
     *     to='coven@chat.shakespeare.lit/thirdwitch'>
     *   <x xmlns='http://jabber.org/protocol/muc'>
     *     <history seconds='180'/>
     *   </x>
     * </presence>
     */
    it('7.2.15 User Requests History in Last 3 Minutes', function (done) {
      done();
    });

    /*
     * <presence
     *     from='hag66@shakespeare.lit/pda'
     *     id='n13mt3l'
     *     to='coven@chat.shakespeare.lit/thirdwitch'>
     *   <x xmlns='http://jabber.org/protocol/muc'>
     *     <history since='1970-01-01T00:00:00Z'/>
     *   </x>
     * </presence>
     */
    it('7.2.15 User Requests All History Since the Beginning of the Unix Era', function (done) {
      done();
    });

    /*
     * <presence
     *     from='hag66@shakespeare.lit/pda'
     *     id='n13mt3l'
     *     to='coven@chat.shakespeare.lit/thirdwitch'>
     *   <x xmlns='http://jabber.org/protocol/muc'>
     *     <history maxchars='0'/>
     *   </x>
     * </presence>
     */
    it('7.2.15 User Requests No History', function (done) {
      done();
    });

    /*
     * <message
     *     from='coven@chat.shakespeare.lit/secondwitch'
     *     id='F437C672-D438-4BD3-9BFF-091050D32EE2'
     *     to='crone1@shakespeare.lit/desktop'
     *     type='groupchat'>
     *   <subject>Fire Burn and Cauldron Bubble!</subject>
     * </message>
     */
    it('7.2.16 Room Subject: Service Informs New Occupant of Room Subject', function (done) {
      done();
    });
    /*
     * <message
     *     from='coven@chat.shakespeare.lit/secondwitch'
     *     id='F437C672-D438-4BD3-9BFF-091050D32EE2'
     *     to='crone1@shakespeare.lit/desktop'
     *     type='groupchat'>
     *   <subject></subject>
     * </message>
     */
    it('7.2.16 Room Subject: No Subject', function (done) {
      done();
    });

    /*
     * Occupant Sends a Message to All Occupants
     * <message
     *     from='hag66@shakespeare.lit/pda'
     *     id='hysf1v37'
     *     to='coven@chat.shakespeare.lit'
     *     type='groupchat'>
     *   <body>Harpier cries: 'tis time, 'tis time.</body>
     * </message>
     *
     * Service Reflects Message to All Occupants
     * <message
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     id='E36F45B8-DE06-4534-94AD-C5ED29415FCE'
     *     to='crone1@shakespeare.lit/desktop'
     *     type='groupchat'>
     *   <body>Harpier cries: 'tis time, 'tis time.</body>
     * </message>
     */
    it('7.4 Sending a Message to All Occupants', function (done) {

      var julia, romeo = null;

      var msg = "<message \
          from='hag66@shakespeare.lit/pda' \
          id='hysf1v37' \
          to='coven@chat.shakespeare.lit' \
          type='groupchat'> \
          <body>Harpier cries: 'tis time, 'tis time.</body> \
        </message>"

      // start clients
      Promise.all([helper.startJulia(), helper.startRomeo()]).then(function (results) {
          julia = results[0];
          romeo = results[1];
        }).then(function () {
          // romeo and julia join room
          var juliaJoinStanza = muc_helper.presenceStanza(room, nick, julia.jid.toString())
          julia.send(juliaJoinStanza);

          var romeoJoinStanza = muc_helper.presenceStanza(room, nick, romeo.jid.toString())
          romeo.send(romeoJoinStanza);

        }).then(function(){
          // wait until romeo is online
          return new Promise(function (resolve) {
            romeo.once('stanza', function (stanza) {
              assert.equal(stanza.is('presence'), true, 'Is a presence stanza')
              resolve();
            });
          });
        }).then(function(){
          // send message
          var stanza = ltx.parse(msg);
          stanza.attrs.from = julia.jid.toString();
          stanza.attrs.to = room;
          julia.send(stanza);
        }).then(function () {
          return new Promise(function (resolve) {
            romeo.on('stanza', function (stanza) {
              if (stanza.is('message')) {
                
                assert.equal(stanza.attrs.from, 'julia_room_01@chat.example.net/julia');

                var body = stanza.getChild('body');
                assert.equal(body.getText(), 'Harpier cries: \'tis time, \'tis time.');
                resolve();
              }
            });
          });
        }).then(function () {
          done();
        }).catch(function (err) {
          done(err);
        });

    });

    /*
     * Occupant Sends Private Message
     * <message
     *     from='wiccarocks@shakespeare.lit/laptop'
     *     id='hgn27af1'
     *     to='coven@chat.shakespeare.lit/firstwitch'
     *     type='chat'>
     *   <body>I'll give thee a wind.</body>
     * </message>
     * Recipient Receives the Private Message
     * <message
     *     from='coven@chat.shakespeare.lit/firstwitch'
     *     id='hgn27af1'
     *     to='crone1@shakespeare.lit/desktop'
     *     type='chat'>
     *   <body>I'll give thee a wind.</body>
     * </message>
     */
    it('7.5 Sending a Private Message', function (done) {
      done();
    });

    /*
     * Occupant Changes Nickname
     * <presence
     *     from='hag66@shakespeare.lit/pda'
     *     id='ifd1c35'
     *     to='coven@chat.shakespeare.lit/oldhag'/>
     *
     * Service Updates Nick
     * <presence
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     id='5C1B95B3-7CCC-4422-A952-8885A050BDE9'
     *     to='crone1@shakespeare.lit/desktop'
     *     type='unavailable'>
     *   <x xmlns='http://jabber.org/protocol/muc#user'>
     *     <item affiliation='member'
     *           jid='hag66@shakespeare.lit/pda'
     *           nick='oldhag'
     *           role='participant'/>
     *     <status code='303'/>
     *   </x>
     * </presence>
     */
    it('7.6 Changing Nickname', function (done) {
      done();
    });

    /*
     * Service Denies Nickname Change Because of Nick Conflict
     * <presence
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     id='ifd1c35'
     *     to='hag66@shakespeare.lit/pda'
     *     type='error'>
     *   <x xmlns='http://jabber.org/protocol/muc'/>
     *   <error by='coven@chat.shakespeare.lit' type='cancel'>
     *     <conflict xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
     *   </error>
     * </presence>
     */
    it('7.6 Service Denies Nickname Change Because of Nick Conflict', function (done) {
      done();
    });

    /*
     * Service Denies Nickname Change Because Roomnicks Are Locked Down
     * <presence
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     id='ifd1c35'
     *     to='hag66@shakespeare.lit/pda'
     *     type='error'>
     *   <x xmlns='http://jabber.org/protocol/muc'/>
     *   <error by='coven@chat.shakespeare.lit' type='cancel'>
     *     <not-acceptable xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
     *   </error>
     * </presence>
     */
    it('7.6 Service Denies Nickname Change Because Roomnicks Are Locked Down', function (done) {
      done();
    });

    /*
     * Occupant Changes Availability Status
     * <presence
     *     from='wiccarocks@shakespeare.lit/laptop'
     *     id='kr7v143h'
     *     to='coven@chat.shakespeare.lit/oldhag'>
     *   <show>xa</show>
     *   <status>gone where the goblins go</status>
     * </presence>
     *
     * Service Passes Along Changed Presence to All Occupants
     * <presence
     *     from='coven@chat.shakespeare.lit/secondwitch'
     *     id='86E11ABF-26BC-46F1-AD3B-F5E54F3C1EE5'
     *     to='crone1@shakespeare.lit/desktop'>
     *   <show>xa</show>
     *   <status>gone where the goblins go</status>
     *   <x xmlns='http://jabber.org/protocol/muc#user'>
     *     <item affiliation='admin'
     *           jid='wiccarocks@shakespeare.lit/laptop'
     *           role='moderator'/>
     *   </x>
     * </presence>
     */
    it('7.7 Changing Availability Status', function (done) {
      done();
    });

    /*
     * Send message:
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
     * Server response:
     * <message
     *     from=’coven@chat.shakespeare.lit’
     *     id=’nzd143v8’
     *     to=’hecate@shakespeare.lit’>
     *     <x xmlns=’http://jabber.org/protocol/muc#user’>
     *         <invite from=’crone1@shakespeare.lit/desktop’>
     *             <reason>
     *             Hey Hecate, this is the place for all good witches!
     *             </reason>
     *         </invite>
     *         <password>cauldronburn</password>
     *     </x>
     * </message>
     */
    it('7.8.2 Mediated Invitation', function (done) {
      var julia, benvolio = null;

      var invitee = 'benvolio@example.net';

      var msg =
        "<message  \
          id='nzd143v8'  \
          to='coven@chat.shakespeare.lit'>  \
          <x xmlns='http://jabber.org/protocol/muc#user'>  \
            <invite to='" + invitee + "'>  \
              <reason>Hey Hecate, this is the place for all good witches!</reason> \
            </invite>  \
          </x>  \
        </message>";

      // start clients
      Promise.all([helper.startJulia(), helper.startBenvolio()]).then(function (results) {
          julia = results[0];
          benvolio = results[1];
        })
        // send message
        .then(function () {
          var stanza = ltx.parse(msg);
          stanza.attrs.from = julia.jid.toString();
          stanza.attrs.to = room;
          julia.send(stanza);
        })
        .then(function () {
          return new Promise(function (resolve) {
            benvolio.once('stanza', function (stanza) {
              assert.equal(stanza.is('message'), true)

              var invite = stanza.getChild('x').getChild('invite');
              assert.equal(invite.attrs.from, 'julia@example.net')
              var reason = invite.getChild('reason');
              assert.equal(reason.getText(), 'Hey Hecate, this is the place for all good witches!' )

              resolve();
            });
          });
        })
        .then(function () {
          done();
        }).catch(function (err) {
          done(err);
        });
    });

    /*
     * 7.14 Exiting a Room
     * <presence
     *     from='hag66@shakespeare.lit/pda'
     *     to='coven@chat.shakespeare.lit/thirdwitch'
     *     type='unavailable'/>
     *
     * Service Sends Self-Presence Related to Departure of Occupant
     * <presence
     *     from='coven@chat.shakespeare.lit/thirdwitch'
     *     to='hag66@shakespeare.lit/pda'
     *     type='unavailable'>
     *   <x xmlns='http://jabber.org/protocol/muc#user'>
     *     <item affiliation='member'
     *           jid='hag66@shakespeare.lit/pda'
     *           role='none'/>
     *     <status code='110'/>
     *   </x>
     * </presence>
     */
    it('7.14 Exiting a Room', function (done) {
      done();
    });

    /*
     * Custom Exit Message
     * <presence
     *     from='wiccarocks@shakespeare.lit/laptop'
     *     to='coven@chat.shakespeare.lit/oldhag'
     *     type='unavailable'>
     *   <status>gone where the goblins go</status>
     * </presence>
     */
    it('7.14 Custom Exit Message', function (done) {
      done();
    });
  });
});