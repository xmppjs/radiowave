'use strict';

// assertion
var assert = require('assert'),
  should = require('should'),
  Promise = require('bluebird'),
  ltx = require('ltx'),
  helper = require('./_helper/helper');

// Xep Components
var Xep0092 = require('../lib/components/Core/modules/Xep0092-version');

function configureXEP(server) {
  // register messaging component
  server.cr.addComponent(new Xep0092());
}

var NS_VERSION = 'jabber:iq:version',
  NAME = 'xRocket',
  VERSION = '0.1.0',
  OS = 'xRocket operating system';

describe('Version', function () {
  describe('C2S', function () {

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

    it('should return the version', function (done) {
      // generate 
      var id = 'verion_1';
      var stanza = new ltx.Element('iq', {
        to: 'example.net',
        from: helper.userRomeo.jid,
        type: 'get',
        id: id
      }).c('query', {
        'xmlns': NS_VERSION
      });

      helper.sendMessageWithRomeo(stanza.root()).then(function (stanza) {
        try {

          assert.equal(stanza.is('iq'), true, 'wrong stanza ' + stanza.root().toString());

          assert.equal(stanza.attrs.type, 'result');
          assert.equal(stanza.attrs.id, id);

          var query = stanza.getChild('query', NS_VERSION);
          assert.notEqual(query, null);

          assert.equal(query.getChild('name').getText(), NAME);
          assert.equal(query.getChild('version').getText(), VERSION);
          assert.equal(query.getChild('os').getText(), OS);

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