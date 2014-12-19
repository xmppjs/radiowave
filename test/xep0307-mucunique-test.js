'use strict';

// assertion
var assert = require('assert'),
  should = require('should'),
  Promise = require('bluebird'),
  ltx = require('ltx'),
  helper = require('./_helper/helper');

// Xep Components
var Xep0307 = require('../lib/components/Xep0045-muc/modules/Unique');

function configureXEP(server) {
  // register messaging component
  server.cr.addComponent(new Xep0307());
}

describe('XEP-0307', function () {

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

  /*
   * <iq from='crone1@shakespeare.lit/desktop'
   *     id='unique1'
   *     to='chat.shakespeare.lit'
   *     type='get'>
   *   <unique xmlns='http://jabber.org/protocol/muc#unique'/>
   * </iq>
   *
   * <iq from='chat.shakespeare.lit'
   *     id='unique1'
   *     to='crone1@shakespeare.lit/desktop'
   *     type='result'>
   *   <unique xmlns='http://jabber.org/protocol/muc#unique'>
   *     6d9423a55f499b29ad20bf7b2bdea4f4b885ead1
   *   </unique>
   * </iq>
   */
  it('Entity Requests Unique Room Name', function (done) {

    var stanza = new ltx.Element('iq', {
      to: 'chat.example.net',
      from: helper.userRomeo.jid,
      type: 'get'
    });
    stanza.c('unique', {
      'xmlns': 'http://jabber.org/protocol/muc#unique'
    });

    helper.sendMessageWithRomeo(stanza.root()).then(function (stanza) {
      try {

        assert.equal(stanza.is('iq'), true, 'wrong stanza ' + stanza.root().toString());

        assert.equal(stanza.attrs.type, 'result');

        var unique = stanza.getChild('unique', 'http://jabber.org/protocol/muc#unique');
        unique.should.not.be.empty;

        var id = unique.text();
        id.should.match(/[A-Za-z0-9-]{36}/); // uuid

        done();

      } catch (err) {
        done(err);
      }
    }).catch(function (err) {
      done(err);
    });
  });
});