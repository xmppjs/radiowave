'use strict';

var Promise = require('bluebird'),
    winston = require('winston'),
    logger = winston.loggers.get('webapi');

var User = function (storage) {
    this.storage = storage;
};

User.prototype = {

    findUser: function (jid) {
        var storage = this.storage;
        return new Promise(function (resolve, reject) {
            storage.User.find({
                where: {
                    jid: jid
                }
            }).success(function (user) {
                resolve(user);
            }).error(function () {
                reject();
            });
        });
    },

    delRoom: function (room) {
        return new Promise(function (resolve, reject) {
            room.destroy().success(function () {
                resolve();
            }).error(function (err) {
                reject(err);
            });
        });
    },

    getRoom: function (owner, roomname) {
        var storage = this.storage;
        return new Promise(function (resolve, reject) {
            if (owner) {
                var affiliation = [];
                affiliation.push(storage.RoomMembers.Affiliation.Owner);

                // Owner as default affiliation
                owner.getRooms({
                    where: {
                        name: roomname,
                        affiliation: affiliation
                    }
                }).success(function (ownerRooms) {
                    if (ownerRooms && ownerRooms.length >= 1) {
                        resolve(ownerRooms[0]);
                    } else {
                        reject();
                    }
                }).error(function () {
                    reject();
                });
            } else {
                reject();
            }
        });
    },

    getRooms: function (user, type) {
        var storage = this.storage;
        return new Promise(function (resolve, reject) {
            if (user) {

                type = type || 'all';

                var affiliation = [];

                switch (type) {
                case 'owner':
                    affiliation.push(storage.RoomMembers.Affiliation.Owner);
                    break;
                case 'member':
                    affiliation.push(storage.RoomMembers.Affiliation.Member);
                    break;
                default: // all 
                    affiliation.push(storage.RoomMembers.Affiliation.Owner);
                    affiliation.push(storage.RoomMembers.Affiliation.Member);
                    break;
                }

                // Owner as default affiliation
                user.getRooms({
                    where: {
                        affiliation: affiliation
                    }
                }).success(function (ownerRooms) {
                    resolve(ownerRooms);
                }).error(function () {
                    reject();
                });
            } else {
                reject();
            }

        });
    },

    addRoom: function (user, data) {
        var storage = this.storage;
        return new Promise(function (resolve, reject) {

            if (user) {
                logger.debug('user' + JSON.stringify(user));

                storage.Room.create({
                    name: data.name,
                    subject : data.subject,
                    description: data.description
                }).success(function (room) {

                    logger.debug('room:' + JSON.stringify(room));
                    user.addRoom(room, {
                        role: storage.RoomMembers.Role.Moderator,
                        affiliation: storage.RoomMembers.Affiliation.Owner,
                        nickname: ''
                    }).success(function () {
                        // added room as member
                        resolve(room);
                    }).error(function (err) {
                        logger.error('Room Members: ' + err);
                        reject();
                    });

                }).error(function (err) {
                    logger.error('error room create: ' + err);
                    reject('room exists');
                });
            } else {
                reject('user is missing');
            }
        });

    },

    addMember: function (room, user) {
        console.log('ADD MEMBER');
        var storage = this.storage;

        console.log(storage.RoomMembers.Role.Participant);
        console.log(storage.RoomMembers.Affiliation.Member);

        return new Promise(function (resolve, reject) {

            room.addMember(user, {
                role: storage.RoomMembers.Role.Participant,
                affiliation: storage.RoomMembers.Affiliation.Member,
                nickname: ''
            }).success(function () {
                // added member to room
                resolve();
            }).error(function (err) {
                logger.error(err);
                reject();
            });

        });
    },

    removeMember: function (room, user) {
        return new Promise(function (resolve, reject) {
            room.removeMember(user).success(function () {
                // removed member to room
                resolve();
            }).error(function (err) {
                logger.error(err);
                reject();
            });
        });
    },

    getChannels: function (user, type) {
        var storage = this.storage;
        return new Promise(function (resolve, reject) {
            if (user) {

                type = type || 'all';

                var affiliation = [];

                switch (type) {
                case 'owner':
                    affiliation.push(storage.ChannelSub.Affiliation.Owner);
                    break;
                case 'member':
                    affiliation.push(storage.ChannelSub.Affiliation.Member);
                    break;
                case 'publisher':
                    affiliation.push(storage.ChannelSub.Affiliation.Publisher);
                    break;
                default: // all 
                    affiliation.push(storage.ChannelSub.Affiliation.Owner);
                    affiliation.push(storage.ChannelSub.Affiliation.Member);
                    affiliation.push(storage.ChannelSub.Affiliation.Publisher);
                    break;
                }

                // Owner as default affiliation
                user.getChannels({
                    where: {
                        affiliation: affiliation
                    }
                }).success(function (ownerChannels) {
                    resolve(ownerChannels);
                }).error(function (err) {
                    reject(err);
                });
            } else {
                reject();
            }
        });
    },

    addChannel: function (user, data) {
        var storage = this.storage;
        return new Promise(function (resolve, reject) {
            if (user) {
                storage.Channel.create({
                    name: data.name
                }).success(function (channel) {

                    user.addChannel(channel, {
                        affiliation: storage.ChannelSub.Affiliation.Owner,
                        substate: storage.ChannelSub.SubState.Member
                    }).success(function () {
                        resolve(channel);
                    }).error(function (err) {
                        reject();
                    });

                }).error(function (err) {
                    reject('channel exists');
                });
            } else {
                reject('user is missing');
            }
        });
    }
};

module.exports = User;