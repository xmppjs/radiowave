'use strict';

var Promise = require('bluebird'),
    ltx = require('ltx');

var helper = require('./helper')

function juliaCreateRoom (room, nick, done) {
    console.log('julia creates a new room');
    var julia;
    var nickname = room + '/' + nick;

    var msg =
    "<presence> \
        <x xmlns='http://jabber.org/protocol/muc'/> \
    </presence>";

    var stanza;

    // start clients
    Promise.all([helper.startJulia()]).then(function (results) {
        console.log('julia is online');
        julia = results[0];
    })
    // send message
    .then(function () {
        stanza = ltx.parse(msg);
        stanza.attrs.from = julia.jid.toString();
        stanza.attrs.to = nickname;

        console.log('julia send message: ' + stanza.toString());
        julia.send(stanza);
    })
    // wait for response
    .then(function () {

        return new Promise(function (resolve, reject) {
            julia.on('stanza', function (stanza) {
                console.log('julia recieved: ' + stanza.toString());
                // verify message
                if (stanza.is('presence')) {
                    resolve();
                } else {
                    reject('wrong stanza ' + stanza.root().toString());
                }
            });

            julia.on('error', function (error) {
                console.error(error);
            });

        });

    }).then(function () {
        console.log('julia logs out');
        julia.end();
        done();
    }).
    catch (function (err) {
        console.error(err);
        julia.end();
        done(err);
    });
}


module.exports = {
    'juliaCreateRoom' : juliaCreateRoom
};