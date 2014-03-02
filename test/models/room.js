var uuid = require('node-uuid');
var assert = require('assert');
var Sequelize = require('sequelize');
var databaseModels = require('../../storage/models');

describe('Model', function () {

    var db = null;

    before(function (done) {

        var sequelize = new Sequelize('database', 'username', 'password', {
            dialect: 'sqlite',
            storage: './database.sqlite'
        });

        // load the database model
        console.log('load database');
        db = databaseModels(sequelize);

        // sync model
        console.log('sync database models');
        sequelize.sync({
            force: true
        })
            .complete(function (err) {
                console.log('test');
                done(err);
            });
    });


    describe('User', function () {

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
                        role: 'moderator',
                        affiliation: 'owner',
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
                        role: 'moderator',
                        affiliation: 'owner',
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
                        role: 'moderator',
                        affiliation: 'owner',
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

                    room.addUser(user, {
                        role: 'participant',
                        affiliation: 'member',
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

                    room.addUser(user, {
                        role: 'participant',
                        affiliation: 'member',
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
                        affiliation: 'owner'
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

                db.Message.create({
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

    });
});