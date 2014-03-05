'use strict';

var Promise = require('bluebird'),
    ltx = require('ltx'),
    uuid = require('node-uuid'),
    JID = require('node-xmpp-core').JID;

var helper = require('./helper');


function createNodeStanza(jid, node, id) {
    id = id || uuid.v4();
    var create = new ltx.Element('iq', {
        to: 'pubsub.example.net',
        from: jid,
        type: 'set',
        id: id
    }).c('pubsub', {
        'xmlns': 'http://jabber.org/protocol/pubsub'
    }).c('create', {
        'node': node
    });

    return create.root();
}

function deleteNodeStanza(jid, node, id) {
    id = id || uuid.v4();
    var deleteIq = new ltx.Element('iq', {
        to: 'pubsub.example.net',
        from: jid,
        type: 'set',
        id: id
    }).c('pubsub', {
        'xmlns': 'http://jabber.org/protocol/pubsub#owner'
    }).c('delete', {
        'node': node
    });

    return deleteIq.root();
}

function subscribeNodeStanza(jid, node, id) {
    id = id || uuid.v4();

    var subscribe = new ltx.Element('iq', {
        to: 'pubsub.example.net',
        from: jid,
        type: 'set',
        id: id
    }).c('pubsub', {
        'xmlns': 'http://jabber.org/protocol/pubsub'
    }).c('subscribe', {
        'node': node,
        'jid': new JID(jid.toString()).bare()
    });

    return subscribe;
}

function sendMessageWithRomeo(stanza) {

    return new Promise(function (resolve, reject) {
        var romeo;

        // start clients
        Promise.all([helper.startRomeo()]).then(function (results) {
            console.log('romeo is online');
            romeo = results[0];
        })
        // send message
        .then(function () {
            console.log('romeo send message: ' + stanza.toString());
            romeo.send(stanza);
        })
        // wait for response
        .then(function () {

            return new Promise(function (recieve_resolve, recieve_reject) {
                romeo.once('stanza', function (stanza) {
                    console.log('romeo recieved: ' + stanza.toString());
                    recieve_resolve(stanza);
                });

                romeo.on('error', function (error) {
                    console.error(error);
                    recieve_reject(error);
                });

            });

        }).then(function (message) {
            console.log('romeo logs out');
            romeo.end();
            resolve(message);
        }).
        catch (function (err) {
            console.error(err);
            romeo.end();
            reject(err);
        });
    });
}

module.exports = {
    'createNodeStanza': createNodeStanza,
    'deleteNodeStanza': deleteNodeStanza,
    'subscribeNodeStanza': subscribeNodeStanza,
    'sendMessageWithRomeo' : sendMessageWithRomeo
};