// assertion
var assert = require('assert'),
    should = require('should');

var MucRoom = require('../xep/Xep0045-muc/MucRoom');

describe('Muc Rooms', function () {

    it('Minimum parameters: all missing', function (done) {
        // check that the minimum of is required (name, subdomain) must be set
        try {
            var pub = new MucRoom();
            done("properties not checked");
        } catch (err) {
            done();
        }
    });

    it('Minimum parameters: empty object', function (done) {
        // check that the minimum of is required (name, subdomain) must be set
        try {
            var room = new MucRoom({});
            done("properties not checked");
        } catch (err) {
            done();
        }
    });

    it('Minimum parameters: missing subdomain', function (done) {
        // check that the minimum of is required (name, subdomain) must be set
        try {
            var room = new MucRoom({
                'name': 'name1'
            });
            done("properties not checked");
        } catch (err) {
            done();
        }
    });


    it('Minimum parameters: missing node name', function (done) {
        // check that the minimum of is required (name, subdomain) must be set
        try {
            var room = new MucRoom({
                'subdomain': 'chat'
            });
            done("properties not checked");
        } catch (err) {
            done();
        }
    });

    var members = ['romeo@example.net', 'john@example.net'];
    var room = null;

    it('Minimum parameters: all set', function (done) {
        // check that the minimum of is required (name, subdomain) must be set
        room = new MucRoom({
            'name': 'name1',
            'subdomain': 'chat'
        });
        done();
    });

    it('Join user', function (done) {

        var result = {
            "name": "name1",
            "subdomain": "chat",
            "members": {
                "romeo@example.net": {
                    "nick": "romeo"
                }
            }
        };

        room.join('romeo@example.net', 'romeo');
        assert.equal(JSON.stringify(room.getRoomDescription()), JSON.stringify(result));
        assert.equal(room.countMembers(), 1);
        done();
    });

    it('Join user', function (done) {

        var result = {
            "name": "name1",
            "subdomain": "chat",
            "members": {
                "romeo@example.net": {
                    "nick": "romeo"
                },
                "john@example.net": {
                    "nick": "John Doe"
                }
            }
        };

        room.join('john@example.net', 'John Doe');
        assert.equal(JSON.stringify(room.getRoomDescription()), JSON.stringify(result));
        assert.equal(room.countMembers(), 2);
        done();
    });

    it('Get all members', function (done) {
        var members = room.getMembers();
        console.log(members);
        // compare result with expected subscriptions
        assert.deepEqual(members.sort(), members.sort());
        assert.equal(room.countMembers(), 2);
        done();
    });

    it('Set configuration', function (done) {
        var title = "room title"
        room.setConfiguration("muc#roomconfig_roomname",title);
        var readtitle = room.getConfiguration("muc#roomconfig_roomname");
        assert.equal(readtitle, title);
        done();
    });

    it('Is romeo member', function (done) {
        assert.ok(room.isMember(members[0]));
        done();
    });

    it('Is john member', function (done) {
        assert.ok(room.isMember(members[1]));
        done();
    });

    it('Get nick from romeo', function (done) {
        assert.equal(room.getNick(members[0]),'romeo');
        done();
    });

    it('Get nick from john', function (done) {
        assert.equal(room.getNick(members[1]),'John Doe');
        done();
    });

    it('Delete subscription', function (done) {
        room.leave(members[0]);
        //console.log("SUBS: " + room.isSubscribed(members[0]));
        assert.equal(room.isMember(members[0]), false);
        assert.ok(room.isMember(members[1]));
        assert.equal(room.countMembers(), 1);
        done();
    });

    it('Delete subscription', function (done) {
        room.leave(members[1]);
        assert.equal(room.isMember(members[0]), false);
        assert.equal(room.isMember(members[1]), false);
        assert.equal(room.countMembers(), 0);
        done();
    });

});