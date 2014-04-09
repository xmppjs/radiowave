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

            if (!jid) {
                reject();
                return;
            }

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

            if (!room) {
                reject();
                return;
            }

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
            if (!owner ||  !roomname) {
                reject('no owner or roomname');
                return;
            }

            var affiliation = [];
            affiliation.push(storage.RoomMembers.Affiliation.Owner);

            // Owner as default affiliation
            owner.getRooms({
                where: {
                    name: roomname,
                    affiliation: affiliation
                }
            }).success(function (ownerRooms) {
                console.log('found rooms' + ownerRooms);
                if (ownerRooms && ownerRooms.length >= 1) {
                    resolve(ownerRooms[0]);
                } else {
                    reject();
                }
            }).error(function () {
                reject();
            });
        });
    },

    getRooms: function (user, type) {
        var storage = this.storage;
        return new Promise(function (resolve, reject) {
            if (!user) {
                reject();
                return;
            }

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
                attributes: ['id'],
                where: {
                    affiliation: affiliation
                }
            }).success(function (userRooms) {

                var ids = userRooms.map(function (val) {
                    return val.id;
                });

                console.log(JSON.stringify(ids));

                // read rooms with members
                storage.Room.findAll({
                    // include owner
                    include: [{
                        model: storage.User,
                        attributes: ['jid'],
                        as: 'Members'
                    }],
                    where: {
                        id: ids
                    }
                }).success(function (ownerRooms) {
                    resolve(ownerRooms);
                }).error(function () {
                    reject();
                });

            }).error(function () {
                reject();
            });

        });
    },

    addRoom: function (user, data) {
        var storage = this.storage;
        return new Promise(function (resolve, reject) {

            if (!user ||  !data) {
                reject();
                return;
            }

            logger.debug('user' + JSON.stringify(user));

            storage.Room.create({
                name: data.name,
                subject: data.subject,
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
        });

    },

    updateRoom: function (room, data) {

        return new Promise(function (resolve, reject) {

            if (!room ||  !data) {
                reject();
                return;
            }

            var updates = {};

            if (data.subject) {
                updates.subject = data.subject;
            }

            if (data.description) {
                updates.description = data.description;
            }

            room.updateAttributes(updates).success(function () {
                resolve();
            }).error(function (err) {
                reject(err);
            });
        });
    },

    addMember: function (room, user) {
        console.log('ADD MEMBER');
        var storage = this.storage;

        return new Promise(function (resolve, reject) {

            if (!room ||  !user) {
                reject();
                return;
            }

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

            if (!room ||  !user) {
                reject();
                return;
            }

            room.removeMember(user).success(function () {
                // removed member to room
                resolve();
            }).error(function (err) {
                logger.error(err);
                reject();
            });
        });
    },

    getChannel: function (owner, channelname) {
        console.log('get channel');
        var storage = this.storage;
        return new Promise(function (resolve, reject) {
            if (!owner ||  !channelname) {
                reject('no owner or channelname');
                return;
            }

            var affiliation = [];
            affiliation.push(storage.ChannelSub.Affiliation.Owner);

            // Owner as default affiliation
            owner.getChannels({
                where: {
                    name: channelname,
                    affiliation: affiliation
                }
            }).success(function (ownerChannels) {
                if (ownerChannels && ownerChannels.length >= 1) {
                    resolve(ownerChannels[0]);
                } else {
                    reject();
                }
            }).error(function () {
                reject();
            });
        });
    },

    getChannels: function (user, type) {
        var storage = this.storage;
        return new Promise(function (resolve, reject) {

            if (!user) {
                reject();
                return;
            }

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

        });
    },

    addChannel: function (user, data) {
        var storage = this.storage;
        return new Promise(function (resolve, reject) {

            if (!user) {
                reject();
                return;
            }

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

        });
    }
};

module.exports = User;