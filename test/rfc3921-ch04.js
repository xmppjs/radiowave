'use strict';

// assertion
var assert = require('assert'),
    should = require('should'),
    Promise = require('bluebird'),
    ltx = require('ltx'),
    helper = require('./_helper/helper');

// Xep Components
var Rfc3921Messaging = require('../lib/components/Core/modules/Rfc3921-messaging');

function configureXEP(server) {
    // register messaging component
    server.cr.register(new Rfc3921Messaging());
}

function generateMessage (to, from) {
    var el = ltx.parse("<message to='" + to + "' from='" + from + "' type='chat' xml:lang='en'></message>");
    return el.root();
}

function sendMessageFromJuliaToRomeo (stanza) {
    return new Promise(function(resolve, reject) {
        var julia, romeo = null;
        
        // start clients
        Promise.all([helper.startJulia(), helper.startRomeo()]).then(function (results) {
            julia = results[0];
            romeo = results[1];
        })
        .then(function () {
            // send publish message
            console.log('julia send: '+ stanza.root().toString());
            julia.send(stanza);
        })
        .then(function (){
            romeo.once('stanza', function(stanza){
                resolve(stanza);
            });
        }).catch(reject);     
    });
}

describe('Rfc3921', function () {
    describe('Messaging', function () {

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

        /**
         * sample message :
         *
         * <message
         *     to='romeo@example.net'
         *     from='juliet@example.com/balcony'
         *     type='chat'
         *     xml:lang='en'>
         *   <body>Wherefore art thou, Romeo?</body>
         * </message>
         *
         */
        it('4.2. Specifying a Message Type', function (done) {
            
            var stanza = generateMessage(helper.userRomeo.jid, helper.userJulia.jid );
            var body = ltx.parse("<body>Wherefore art thou, Romeo?</body>");
            stanza.cnode(body);

            sendMessageFromJuliaToRomeo(stanza).then(function(message){
                try {
                    var responseBody = message.getChild('body');
                    assert.equal(body.toString(), responseBody.toString());
                    done();
                } catch(err) {
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });
           
        });

        /**
         * sample message :
         *
         * <message
         *     to='romeo@example.net'
         *     from='juliet@example.com/balcony'
         *     type='chat'
         *     xml:lang='en'>
         *   <body>Wherefore art thou, Romeo?</body>
         *   <body xml:lang='cz'>Pro&#x010D;e&#x017D; jsi ty, Romeo?</body>
         * </message>
         *
         */
        it('4.3. Specifying a Message Body', function (done) {
            
            var stanza = generateMessage(helper.userRomeo.jid, helper.userJulia.jid );

            var body = ltx.parse("<body>Wherefore art thou, Romeo?</body>");
            var body2 = ltx.parse("<body xml:lang='cz'>Pro&#x010D;e&#x017D; jsi ty, Romeo?</body>");
            stanza.cnode(body);
            stanza.cnode(body2);

            sendMessageFromJuliaToRomeo(stanza).then(function(message){
                try {
                    var responseBody = message.getChildren('body');
                    assert.equal(body.toString(), responseBody[0].toString());
                    assert.equal(body2.toString(), responseBody[1].toString());
                    done();
                } catch(err) {
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });

        });

        /**
         * sample message :
         *
         * <message
         *     to='romeo@example.net'
         *     from='juliet@example.com/balcony'
         *     type='chat'
         *     xml:lang='en'>
         *   <subject>I implore you!</subject>
         *   <subject
         *       xml:lang='cz'>&#x00DA;p&#x011B;nliv&#x011B; prosim!</subject>
         *   <body>Wherefore art thou, Romeo?</body>
         *   <body xml:lang='cz'>Pro&#x010D;e&#x017D; jsi ty, Romeo?</body>
         * </message>
         *
         */
        it('4.4. Specifying a Message Subject', function (done) {

            var stanza = generateMessage(helper.userRomeo.jid, helper.userJulia.jid );

            var subject = ltx.parse("<subject>I implore you!</subject>");
            var subject2 = ltx.parse("<subject xml:lang='cz'>&#x00DA;p&#x011B;nliv&#x011B; prosim!</subject>");
            stanza.cnode(subject);
            stanza.cnode(subject2);

            var body = ltx.parse("<body>Wherefore art thou, Romeo?</body>");
            var body2 = ltx.parse("<body xml:lang='cz'>Pro&#x010D;e&#x017D; jsi ty, Romeo?</body>");
            stanza.cnode(body);
            stanza.cnode(body2);

            sendMessageFromJuliaToRomeo(stanza).then(function(message){
                try {
                    var responseSubject = message.getChildren('subject');
                    assert.equal(subject.toString(), responseSubject[0].toString());
                    assert.equal(subject2.toString(), responseSubject[1].toString());

                    var responseBody = message.getChildren('body');
                    assert.equal(body.toString(), responseBody[0].toString());
                    assert.equal(body2.toString(), responseBody[1].toString());
                    done();
                } catch(err) {
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });

        });

        /**
         * sample message :
         * <message
         *     to='romeo@example.net/orchard'
         *     from='juliet@example.com/balcony'
         *     type='chat'
         *     xml:lang='en'>
         *   <body>Art thou not Romeo, and a Montague?</body>
         *   <thread>e0ffe42b28561960c6b12b944a092794b9683a38</thread>
         * </message>
         *
         * <message
         *     to='juliet@example.com/balcony'
         *     from='romeo@example.net/orchard'
         *     type='chat'
         *     xml:lang='en'>
         *   <body>Neither, fair saint, if either thee dislike.</body>
         *   <thread>e0ffe42b28561960c6b12b944a092794b9683a38</thread>
         * </message>
         *
         * <message
         *     to='romeo@example.net/orchard'
         *     from='juliet@example.com/balcony'
         *     type='chat'
         *     xml:lang='en'>
         *   <body>How cam'st thou hither, tell me, and wherefore?</body>
         *   <thread>e0ffe42b28561960c6b12b944a092794b9683a38</thread>
         * </message>
         */
        it('4.5. Specifying a Conversation Thread', function (done) {

            var stanza = generateMessage(helper.userRomeo.jid, helper.userJulia.jid );

            var body = ltx.parse("<body>Wherefore art thou, Romeo?</body>");
            var thread = ltx.parse("<thread>e0ffe42b28561960c6b12b944a092794b9683a38</thread>");
            stanza.cnode(body);
            stanza.cnode(thread);

            sendMessageFromJuliaToRomeo(stanza).then(function(message){
                try {

                    var responseBody = message.getChild('body');
                    assert.equal(body.toString(), responseBody.toString());
                    var responseThread = message.getChild('thread');
                    assert.equal(thread.toString(), responseThread.toString());
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