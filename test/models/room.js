'use strict';

var fs = require('fs'),
    uuid = require('node-uuid'),
    assert = require('assert'),
    xRocket = require('../../lib'),
    Storage = xRocket.Storage;

describe('Model', function () {

    var db = null;

    before(function (done) {

        // remove test.sqlite
        try {
            fs.unlinkSync("./test.sqlite");
        } catch (err){
            // do nothing (e.g. if file does not exist)
        }

        db = new Storage({
            "dialect": "sqlite",
            "user": "username",
            "password": "password",
            "database": "database",
            "storage": "./test.sqlite"
        });

        // return promise
        db.initialize().then(function(){
            done();
        }).catch(function(err){
            done(err);
        });

    });

    describe('Room', function () {

        it('create new user', function (done) {

            db.User.bulkCreate([{
                jid: 'john@example.net',
                name: 'John Doe'
            }, {
                jid: 'alice@example.net',
                name: "Alice"
            }, {
                jid: 'bob@example.net',
                name: 'Bob'
            }]).success(function (user) {
                // cool users are there
                done();
            }).error(function (err) {
                done(err);
            });

        });

        it('john creates new room 1', function (done) {

            db.User.find({
                where: {
                    jid: 'john@example.net'
                }
            }).success(function (user) {

                db.Room.create({
                    uuid: uuid.v4(),
                    name: 'room1'
                }).success(function (room) {
                    // done();

                    user.addRoom(room, {
                        role: db.RoomMembers.Role.Moderator,
                        affiliation: db.RoomMembers.Affiliation.Owner,
                        nickname: 'jj'
                    }).success(function () {
                        console.log('got here');
                        // added room as member
                        done();
                    }).error(function (err) {
                        done(err);
                    });

                });
            }).error(function (err) {
                done(err);
            });

        });

        it('bob creates new room 2', function (done) {

            db.User.find({
                where: {
                    jid: 'bob@example.net'
                }
            }).success(function (user) {

                db.Room.create({
                    uuid: uuid.v4(),
                    name: 'room2'
                }).success(function (room) {
                    // done();

                    user.addRoom(room, {
                        role: db.RoomMembers.Role.Moderator,
                        affiliation: db.RoomMembers.Affiliation.Owner,
                        nickname: 'bb'
                    }).success(function () {
                        console.log('got here');
                        // added room as member
                        done();
                    }).error(function (err) {
                        done(err);
                    });

                });
            }).error(function (err) {
                done(err);
            });

        });

        it('alice creates new room 3', function (done) {

            db.User.find({
                where: {
                    jid: 'alice@example.net'
                }
            }).success(function (user) {

                db.Room.create({
                    uuid: uuid.v4(),
                    name: 'room3'
                }).success(function (room) {
                    // done();

                    user.addRoom(room, {
                        role: db.RoomMembers.Role.Moderator,
                        affiliation: db.RoomMembers.Affiliation.Owner,
                        nickname: 'aa'
                    }).success(function () {
                        console.log('got here');
                        // added room as member
                        done();
                    }).error(function (err) {
                        done(err);
                    });

                });
            }).error(function (err) {
                done(err);
            });

        });

        it('add alice to room 1', function (done) {

            db.Room.find({
                where: {
                    name: 'room1'
                }
            }).success(function (room) {

                db.User.find({
                    where: {
                        jid: 'alice@example.net'
                    }
                }).success(function (user) {

                    room.addMember(user, {
                        role: db.RoomMembers.Role.Participant,
                        affiliation: db.RoomMembers.Affiliation.Member,
                        nickname: 'ar1'
                    }).success(function () {
                        done();
                    });

                });
            }).error(function (err) {
                done(err);
            });
        });

        it('add alice to room 2', function (done) {

            db.Room.find({
                where: {
                    name: 'room2'
                }
            }).success(function (room) {

                db.User.find({
                    where: {
                        jid: 'alice@example.net'
                    }
                }).success(function (user) {

                    room.addMember(user, {
                        role: db.RoomMembers.Role.Participant,
                        affiliation: db.RoomMembers.Affiliation.Member,
                        nickname: 'ar2'
                    }).success(function () {
                        done();
                    });

                });
            }).error(function (err) {
                done(err);
            });
        });

        it('get all rooms where alice is owner', function (done) {

            // find all rooms where I am owner

            db.User.find({
                where: {
                    jid: 'alice@example.net'
                }
            }).success(function (user) {

                /*user.getRooms().success(function(rooms){

                    var ownerRooms = [];

                    // find rooms where alice is owner
                    rooms.forEach(function(room){
                        if (room.RoomMembers.affiliation === 'owner') {
                            ownerRooms.push(room);
                        }
                    });

                    assert.equal(ownerRooms.length, 1);

                    done();
                });*/

                user.getRooms({
                    where: {
                        affiliation: db.RoomMembers.Affiliation.Owner
                    }
                }).success(function (ownerRooms) {
                    assert.equal(ownerRooms.length, 1);
                    done();
                });
            });
        });

        // should include own rooms as well
        it('get all rooms where alice is member', function (done) {

            // find all rooms where I participate
            db.User.find({
                where: {
                    jid: 'alice@example.net'
                }
            }).success(function (user) {

                user.getRooms().success(function (rooms) {
                    // count length, alice should be part of 3 rooms
                    assert.equal(rooms.length, 3);
                    done();
                });
            });
        });

        it('get the nickname of alice for room2', function (done) {

            // find all rooms where I participate
            db.User.find({
                where: {
                    jid: 'alice@example.net'
                }
            }).success(function (alice) {

                db.Room.find({
                    where: {
                        name: 'room2'
                    }
                }).success(function (room2) {
                    room2.nickname(alice).then(function(nickname){
                        assert.equal(nickname, 'ar2');
                        done();
                    });
                });
                
            });
        });

        // should include own rooms as well
        it('get all rooms where bob is member', function (done) {

            // find all rooms where I participate
            db.User.find({
                where: {
                    jid: 'bob@example.net'
                }
            }).success(function (user) {

                user.getRooms().success(function (rooms) {
                    // count length, alice should be part of 3 rooms
                    assert.equal(rooms.length, 1);
                    done();
                });
            });
        });


        // should include own rooms as well
        it('add a message to room 1', function (done) {

            // find all rooms where I participate
            db.Room.find({
                where: {
                    name: 'room1'
                }
            }).success(function (room) {

                db.RoomMessage.create({
                    content: 'bla blub'
                }).success(function (message) {
                    room.addMessage(message).success(function () {
                        done();
                    });
                });

            });

        });

        // should include own rooms as well
        it('room 1 should contain 1 message', function (done) {

            // find all rooms where I participate
            db.Room.find({
                where: {
                    name: 'room1'
                }
            }).success(function (room) {
                room.getMessages().success(function (messages) {
                    assert.equal(messages.length, 1);
                    done();
                });
            });
        });

        // get all members of room 1
        it('get all members of room 1', function (done) {

            // find all rooms where I participate
            db.Room.find({
                where: {
                    name: 'room1'
                }
            }).success(function (room) {
                room.getMessages().success(function (messages) {
                    assert.equal(messages.length, 1);
                    done();
                });
            });
        });

    });
});