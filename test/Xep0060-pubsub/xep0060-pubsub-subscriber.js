'use strict';

// assertion
var assert = require('assert'),
  should = require('should'),
  helper = require('../_helper/helper'),
  pub_helper = require('../_helper/pubsub');

var ltx = require('ltx'),
  Xep0060 = require('../../lib/components/Xep0060-pubsub');

function configureXEP(server) {
  // register pubsub component
  server.cr.addComponent(new Xep0060({
    subdomain: 'pubsub',
    domain: 'example.net',
    storage: server.storage
  }));
}

/**
 * @see http://xmpp.org/extensions/xep-0060.html
 */
describe('Xep-0060', function () {

  var srv = null;

  before(function (done) {
    this.timeout(5000);
    helper.startServer()
      // configure muc module
      .then(function (server) {
        srv = server;
        configureXEP(server);
        done();
      })
      .
    catch(function (err) {
      done(err);
    });
  });

  after(function (done) {
    srv.connectionRouter.stopConnections();
    done();
  });

  describe('6. Subscriber Use Cases', function () {

    describe('6.1 Subscribe to a Node', function () {

      it('Precondition: Create a node', function (done) {

        var id = 'newnode-r2d2';
        var stanza = pub_helper.createNodeStanza(helper.userRomeo.jid, 'princely_musings', id);

        helper.sendMessageWithRomeo(stanza.root()).then(function (stanza) {
          try {
            assert.equal(stanza.is('iq'), true, 'wrong stanza ' + stanza.root().toString());
            assert.equal(stanza.attrs.type, 'result');
            assert.equal(stanza.attrs.id, id);
            done();
          } catch (err) {
            done(err);
          }
        }).catch(function (err) {
          done(err);
        });
      });

      /*
       * <iq type='error'
       *     from='pubsub.shakespeare.lit'
       *     to='francisco@denmark.lit/barracks'
       *     id='sub1'>
       *   <error type='modify'>
       *     <bad-request xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
       *     <invalid-jid xmlns='http://jabber.org/protocol/pubsub#errors'/>
       *   </error>
       * </iq>
       */
      it('6.1.3.1 JIDs Do Not Match', function (done) {

        var id = 'subscribe-r2d2';

        var stanza = new ltx.Element('iq', {
          to: 'pubsub.example.net',
          from: helper.userRomeo.jid,
          type: 'set',
          id: id
        }).c('pubsub', {
          'xmlns': 'http://jabber.org/protocol/pubsub'
        }).c('subscribe', {
          'node': 'princely_musings',
          'jid': helper.userJulia.jid
        });

        helper.sendMessageWithRomeo(stanza.root()).then(function (stanza) {
          try {
            assert.equal(stanza.is('iq'), true, 'wrong stanza ' + stanza.root().toString());

            assert.equal(stanza.attrs.type, 'error');
            assert.equal(stanza.attrs.id, id);

            var error = stanza.getChild('error');
            error.should.not.be.empty;

            assert.equal(error.attrs.type, 'modify');

            var badrequest = error.getChild('bad-request', 'urn:ietf:params:xml:ns:xmpp-stanzas');
            badrequest.should.not.be.empty;

            var invalid = error.getChild('invalid-jid', 'http://jabber.org/protocol/pubsub#errors');
            invalid.should.not.be.empty;

            done();
          } catch (err) {
            done(err);
          }
        }).catch(function (err) {
          done(err);
        });

      });

      /*
       * <iq type='error'
       *     from='pubsub.shakespeare.lit'
       *     to='francisco@denmark.lit/barracks'
       *     id='sub1'>
       *   <error type='cancel'>
       *     <item-not-found xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
       *   </error>
       * </iq>
       */
      it('6.1.3.12 Node Does Not Exist', function (done) {
        var id = 'subscribe-r2d2';
        var stanza = new ltx.Element('iq', {
          to: 'pubsub.example.net',
          from: helper.userRomeo.jid,
          type: 'set',
          id: id
        }).c('pubsub', {
          'xmlns': 'http://jabber.org/protocol/pubsub'
        }).c('subscribe', {
          'node': 'princely_musings2',
          'jid': helper.userRomeo.jid
        });

        helper.sendMessageWithRomeo(stanza.root()).then(function (stanza) {
          try {
            assert.equal(stanza.is('iq'), true, 'wrong stanza ' + stanza.root().toString());

            assert.equal(stanza.attrs.type, 'error');
            assert.equal(stanza.attrs.id, id);

            var error = stanza.getChild('error');
            error.should.not.be.empty;

            assert.equal(error.attrs.type, 'cancel');

            var badrequest = error.getChild('item-not-found', 'urn:ietf:params:xml:ns:xmpp-stanzas');
            badrequest.should.not.be.empty;

            done();
          } catch (err) {
            done(err);
          }
        }).catch(function (err) {
          done(err);
        });

      });

      /**
       * request
       * <iq type='set'
       *     from='francisco@denmark.lit/barracks'
       *     to='pubsub.shakespeare.lit'
       *     id='sub1'>
       *   <pubsub xmlns='http://jabber.org/protocol/pubsub'>
       *     <subscribe
       *         node='princely_musings'
       *         jid='francisco@denmark.lit'/>
       *   </pubsub>
       * </iq>
       *
       * response
       * <iq type='result'
       *     from='pubsub.shakespeare.lit'
       *     to='francisco@denmark.lit/barracks'
       *     id='sub1'>
       *   <pubsub xmlns='http://jabber.org/protocol/pubsub'>
       *     <subscription
       *         node='princely_musings'
       *         jid='francisco@denmark.lit'
       *         subid='ba49252aaa4f5d320c24d3766f0bdcade78c78d3'
       *         subscription='subscribed'/>
       *   </pubsub>
       * </iq>
       */
      it('6.1 Subscribe to a Node', function (done) {
        var id = 'subscribe-r2d2';
        var stanza = new ltx.Element('iq', {
          to: 'pubsub.example.net',
          from: helper.userRomeo.jid,
          type: 'set',
          id: id
        }).c('pubsub', {
          'xmlns': 'http://jabber.org/protocol/pubsub'
        }).c('subscribe', {
          'node': 'princely_musings',
          'jid': helper.userRomeo.jid
        });

        helper.sendMessageWithRomeo(stanza.root()).then(function (stanza) {
          try {
            assert.equal(stanza.is('iq'), true, 'wrong stanza ' + stanza.root().toString());

            assert.equal(stanza.attrs.type, 'result');
            assert.equal(stanza.attrs.id, id);

            var pubsub = stanza.getChild('pubsub', 'http://jabber.org/protocol/pubsub');
            pubsub.should.not.be.empty;

            var subscription = pubsub.getChild('subscription');
            subscription.should.not.be.empty;

            assert.equal(subscription.attrs.node, 'princely_musings');
            assert.equal(subscription.attrs.jid, helper.userRomeo.jid);
            assert.equal(subscription.attrs.subscription, 'subscribed');

            done();
          } catch (err) {
            done(err);
          }
        }).catch(function (err) {
          done(err);
        });

      });
    });

    describe('6.2. Unsubscribe from a Node', function () {

      /*
       * request
       * <iq type='set'
       *    from='francisco@denmark.lit/barracks'
       *    to='pubsub.shakespeare.lit'
       *    id='unsub1'>
       *  <pubsub xmlns='http://jabber.org/protocol/pubsub'>
       *     <unsubscribe
       *         node='princely_musings'
       *         jid='francisco@denmark.lit'/>
       *  </pubsub>
       * </iq>
       *
       * response
       * <iq type='result'
       *     from='pubsub.shakespeare.lit'
       *     to='francisco@denmark.lit/barracks'
       *     id='unsub1'/>
       */
      it('6.2. Unsubscribe from a Node', function (done) {
        var id = 'unsubscribe-r2d2';
        var stanza = new ltx.Element('iq', {
          to: 'pubsub.example.net',
          from: helper.userRomeo.jid,
          type: 'set',
          id: id
        }).c('pubsub', {
          'xmlns': 'http://jabber.org/protocol/pubsub'
        }).c('unsubscribe', {
          'node': 'princely_musings',
          'jid': helper.userRomeo.jid
        });

        helper.sendMessageWithRomeo(stanza.root()).then(function (stanza) {
          try {
            assert.equal(stanza.is('iq'), true, 'wrong stanza ' + stanza.root().toString());
            assert.equal(stanza.attrs.type, 'result');
            assert.equal(stanza.attrs.id, id);
            done();
          } catch (err) {
            done(err);
          }
        }).catch(function (err) {
          done(err);
        });

      });

      /*
       * <iq type='error'
       *     from='pubsub.shakespeare.lit'
       *     to='francisco@denmark.lit/barracks'
       *     id='unsub1'>
       *   <error type='cancel'>
       *     <unexpected-request xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
       *     <not-subscribed xmlns='http://jabber.org/protocol/pubsub#errors'/>
       *   </error>
       * </iq>
       */
      it('6.2.3.2 No Such Subscriber', function (done) {
        var id = 'unsubscribe-r2d2';
        var stanza = new ltx.Element('iq', {
          to: 'pubsub.example.net',
          from: helper.userJulia.jid,
          type: 'set',
          id: id
        }).c('pubsub', {
          'xmlns': 'http://jabber.org/protocol/pubsub'
        }).c('unsubscribe', {
          'node': 'princely_musings',
          'jid': helper.userJulia.jid
        });

        helper.sendMessageWithJulia(stanza.root()).then(function (stanza) {
          try {
            assert.equal(stanza.is('iq'), true, 'wrong stanza ' + stanza.root().toString());

            assert.equal(stanza.attrs.type, 'error');
            assert.equal(stanza.attrs.id, id);

            var error = stanza.getChild('error');
            error.should.not.be.empty;

            assert.equal(error.attrs.type, 'cancel');

            var unexpected = error.getChild('unexpected-request', 'urn:ietf:params:xml:ns:xmpp-stanzas');
            unexpected.should.not.be.empty;

            var notsubscribed = error.getChild('not-subscribed', 'http://jabber.org/protocol/pubsub#errors');
            notsubscribed.should.not.be.empty;

            done();
          } catch (err) {
            done(err);
          }
        }).catch(function (err) {
          done(err);
        });

      });

      /*
       * <iq type='error'
       *     from='pubsub.shakespeare.lit'
       *     to='francisco@denmark.lit/barracks'
       *     id='unsub1'>
       *   <error type='cancel'>
       *     <item-not-found xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
       *   </error>
       * </iq>
       */
      it('6.2.3.4 Node Does Not Exist', function (done) {
        var id = 'unsubscribe-r2d2';
        var stanza = new ltx.Element('iq', {
          to: 'pubsub.example.net',
          from: helper.userRomeo.jid,
          type: 'set',
          id: id
        }).c('pubsub', {
          'xmlns': 'http://jabber.org/protocol/pubsub'
        }).c('unsubscribe', {
          'node': 'princely_musings_2',
          'jid': helper.userRomeo.jid
        });

        helper.sendMessageWithRomeo(stanza.root()).then(function (stanza) {
          try {
            assert.equal(stanza.is('iq'), true, 'wrong stanza ' + stanza.root().toString());

            assert.equal(stanza.attrs.type, 'error');
            assert.equal(stanza.attrs.id, id);

            var error = stanza.getChild('error');
            error.should.not.be.empty;

            assert.equal(error.attrs.type, 'cancel');

            var itemnotfound = error.getChild('item-not-found', 'urn:ietf:params:xml:ns:xmpp-stanzas');
            itemnotfound.should.not.be.empty;

            done();
          } catch (err) {
            done(err);
          }
        }).catch(function (err) {
          done(err);
        });

      });

      it('Postcondition: delete node', function (done) {
        var id = 'delete-r2d2';
        var stanza = new ltx.Element('iq', {
          to: 'pubsub.example.net',
          from: helper.userRomeo.jid,
          type: 'set',
          id: id
        }).c('pubsub', {
          'xmlns': 'http://jabber.org/protocol/pubsub#owner'
        }).c('delete', {
          'node': 'princely_musings'
        });

        helper.sendMessageWithRomeo(stanza.root()).then(function (stanza) {
          try {
            assert.equal(stanza.is('iq'), true, 'wrong stanza ' + stanza.root().toString());
            assert.equal(stanza.attrs.type, 'result');
            assert.equal(stanza.attrs.id, id);
            done();
          } catch (err) {
            done(err);
          }
        }).catch(function (err) {
          done(err);
        });
      });
    });
  });
});