'use strict';

// assertion
var assert = require('assert'),
    should = require('should'),
    Promise = require('bluebird'),
    ltx = require('ltx'),
    helper = require('./_helper/helper');

// Xep Components
var Xep0199 = require('../lib/components/Core/modules/Xep0199-ping');

function configureXEP(server) {
    // register messaging component
    server.cr.register(new Xep0199());
}

describe('Ping', function () {
    describe('C2S', function () {

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

        it('should accept plain authentication and reply to ping', function (done) {
            var id = 'ping-123';

            var stanza = new ltx.Element('iq', {
                to: 'example.net',
                from: helper.userRomeo.jid,
                type: 'get',
                id: id
            }).c('ping', {
                'xmlns': 'urn:xmpp:ping'
            });

            helper.sendMessageWithRomeo(stanza.root()).then(function(stanza){
                try {

                    assert.equal(stanza.is('iq'),true, 'wrong stanza ' + stanza.root().toString());

                    assert.equal(stanza.attrs.type, 'result');
                    assert.equal(stanza.attrs.id, id);
                    done();
                   
                } catch(err) {
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });

        });
    });
});