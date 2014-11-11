'use strict';

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    Sequelize = require('sequelize'),
    Promise = require('bluebird'),
    models = require('./models');

var logger = require('../core/Logger')('storage');

/**
 * Manage the database abstraction for xrocket
 */
var Storage = function (options) {
    EventEmitter.call(this);

    if (!options) {
        throw new Error('no database options set');
    }
    this.opt = options;
};

util.inherits(Storage, EventEmitter);

Storage.prototype.loadModels = function () {
    // load all models as own properties
    models(this.sequelize, this);
};

/**
 * Initialize the datababe and sync the tables if they are not
 * already there.
 */
Storage.prototype.initialize = function (syncOpts) {
    logger.debug('initialize');

    syncOpts = syncOpts ||  {};
    var self = this;
    return new Promise(function (resolve, reject) {

        var maxConcurrentQueries = self.opt.maxConcurrentQueries ||  100;
        var maxConnections = self.opt.maxConnections ||  1;
        var maxIdleTime = self.opt.maxIdleTime ||  30;

        // base options
        var options = {
            language: 'en',
            maxConcurrentQueries: maxConcurrentQueries,
            pool: {
                maxConnections: maxConnections,
                maxIdleTime: maxIdleTime
            }
        };

        // could be sqlite, postgres, mysql
        if (self.opt.dialect) {
            options.dialect = self.opt.dialect;
        }

        if (self.opt.host) {
            options.host = self.opt.host;
        }

        if (self.opt.port) {
            options.port = self.opt.port;
        }

        // path of the db file for sqlite 
        if (self.opt.storage) {
            options.storage = self.opt.storage;
        }

        // initialize db connection
        var sequelize = new Sequelize(
            self.opt.database,
            self.opt.user,
            self.opt.password, options);
        self.sequelize = sequelize;

        self.loadModels();

        // sync models with database
        sequelize.sync(syncOpts)
            .complete(function (err) {
                if (err) {
                    logger.error(err);
                    reject(err);
                } else {
                    resolve(self);
                }
            });
    });
};

Storage.prototype.findUser = function (jid) {
    var storage = this;
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
            if (user) {
                resolve(user);
            } else {
                reject('could not find user ');
            }
        }).error(function (err) {
            logger.error('could not find user ' + err);
            reject();
        });
    });
};

Storage.prototype.findOrCreateUser = function (jid) {
    var storage = this;
    return new Promise(function (resolve, reject) {

        if (!jid) {
            reject();
            return;
        }

        storage.User.findOrCreate({
            jid: jid
        }).success(function (user) {
            if (user) {
                resolve(user);
            }
            // this should never happen
            else {
                reject('could not find user ');
            }
        }).error(function (err) {
            logger.error('could not find or create user ' + err);
            reject();
        });
    });
};

Storage.prototype.findRoom = function (roomname) {
    var storage = this;
    return new Promise(function (resolve, reject) {
        storage.Room.find({
            where: {
                name: roomname
            }
        }).success(function (room) {
            if (room) {
                resolve(room);
            } else {
                reject();
            }
        }).error(function (err) {
            reject(err);
        });
    });
};

/**
 * owner is an instance of the user
 */
Storage.prototype.getRoom = function (owner, roomname) {
    var storage = this;
    return new Promise(function (resolve, reject) {
        if (!owner ||  !roomname) {
            reject('getRoom: no owner or roomname');
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
            logger.debug('found rooms ' + JSON.stringify(ownerRooms));
            if (ownerRooms && ownerRooms.length >= 1) {
                resolve(ownerRooms[0]);
            } else {
                reject();
            }
        }).error(function () {
            reject();
        });
    });
};

Storage.prototype.getRooms = function (user, type) {
    var storage = this;
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
                affiliation: affiliation,
                state : [storage.RoomMembers.State.Accepted, storage.RoomMembers.State.Pending]
            }
        }).success(function (userRooms) {

            var ids = userRooms.map(function (val) {
                return val.id;
            });

            logger.debug(JSON.stringify(ids));

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
};

Storage.prototype.addRoom = function (user, data) {
    var storage = this;
    return new Promise(function (resolve, reject) {

        if (!user || !data) {
            reject();
            return;
        }

        logger.debug('add room ' + data.name + ' to user user' + JSON.stringify(user));

        storage.Room.create({
            name: data.name,
            subject: data.subject,
            description: data.description
        }).success(function (room) {
        
            room.addMember(user, {
                role: storage.RoomMembers.Role.Moderator,
                affiliation: storage.RoomMembers.Affiliation.Owner,
                nickname: ''
            }).success(function (r) {
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

};

Storage.prototype.updateRoom = function (room, data) {

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

        logger.debug('update room ' + room.name);

        room.updateAttributes(updates).success(function () {
            resolve();
        }).error(function (err) {
            reject(err);
        });
    });
};

Storage.prototype.delRoom = function (room) {
    var storage = this;
    return new Promise(function (resolve, reject) {

        if (!room) {
            reject();
            return;
        }

        logger.debug('remove room ' + room.name);

        // remove members because cascading delete does not work for through tables
        storage.RoomMembers.destroy({
            RoomId: room.id
        }, {});
        
        // delete room
        room.destroy().success(function () {
            resolve();
        }).error(function (err) {
            reject(err);
        });
    });
};

Storage.prototype.addMember = function (room, user) {

    logger.debug('add member');

    var storage = this;
    return new Promise(function (resolve, reject) {

        if (!room ||  !user) {
            reject();
            return;
        }

        room.addMember(user, {
            role: storage.RoomMembers.Role.Participant,
            affiliation: storage.RoomMembers.Affiliation.Member,
            nickname: '',
            state : storage.RoomMembers.State.Accepted
        }).success(function () {
            // added member to room
            resolve();
        }).error(function (err) {
            logger.error(err);
            reject();
        });

    });
};

Storage.prototype.inviteMember = function (data) {
    // TODO do not overwrite existing membership with invitation

    logger.debug('invite member');

    var storage = this;
    return new Promise(function (resolve, reject) {

        if (!data || !data.room || !data.invitee || !data.inviter) {
            reject('room or invitee is missing');
            return;
        }

        logger.debug('compare ' + data.invitee.jid + ' ' + data.inviter.jid );
        if (data.invitee.jid === data.inviter.jid) {
            reject('cannot invite inviter');
            return;
        }

        var room = data.room;

        // check if room has this member already, we cannot invite members
        room.isMember(data.invitee).then(function(){
            reject('user is already member');
        }).catch(function(){
            // add a user as pending
            room.addMember(data.invitee, {
                role: storage.RoomMembers.Role.Participant,
                affiliation: storage.RoomMembers.Affiliation.Member,
                nickname: '',
                state : storage.RoomMembers.State.Pending
            }).success(function () {
                // added member to room
                storage.emit('invite', {
                    room: room,
                    invitee: data.invitee,
                    inviter: data.inviter,
                    reason: data.reason
                });
                resolve();
            }).error(function (err) {
                logger.error(err);
                reject();
            });
        });
    });
};

Storage.prototype.declineMembership = function (room, invitee, inviter, reason) {
    var storage = this;
    return new Promise(function (resolve, reject) {

        if (!room ||  !invitee) {
            reject();
            return;
        }

        // checkout if the current user is member
        room.getMembers({
            where: {
                userid : invitee.id
            }
        }).success(function(users){
            console.log('found users: '+ JSON.stringify(users));

            // user is already part of this room
            if (users && users.length > 0) {
                var roomUser = users[0];

                // update data
                roomUser.RoomMembers.state = storage.RoomMembers.State.Declined;
                roomUser.RoomMembers.save();

                // added member to room
                storage.emit('declined', {
                    room: room,
                    invitee: invitee,
                    inviter: inviter,
                    reason: reason
                });
                resolve(roomUser);
            }
        }).error(function (err) {
            logger.error(err);
            reject();
        });
    });
};

Storage.prototype.removeMember = function (room, user) {
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

Storage.prototype.getChannel = function (owner, channelname) {
    var storage = this;
    return new Promise(function (resolve, reject) {
        if (!owner ||  !channelname) {
            reject('getChannel: no owner or channelname');
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

Storage.prototype.getChannels = function (user, type) {
    var storage = this;
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
};

Storage.prototype.addChannel = function (user, data) {
    var storage = this;
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
};

Storage.prototype.delChannel = function (channel) {
    var storage = this;
    return new Promise(function (resolve, reject) {

        if (!channel) {
            reject();
            return;
        }

        // remove subscribers because cascading delete does not work for through tables
        storage.ChannelSub.destroy({
            ChannelId: channel.id
        }, {});

        // delete channel
        channel.destroy().success(function () {
            resolve();
        }).error(function (err) {
            reject(err);
        });
    });
};

Storage.prototype.findChannel = function (channelname) {
    var storage = this;
    return new Promise(function (resolve, reject) {
        storage.Channel.find({
            where: {
                name: channelname
            }
        }).success(function (channel) {
            logger.debug('Found channel: ' + channel);
            resolve(channel);
        }).error(function (err) {
            reject(err);
        });
    });
};

/**
 * finds or creates a channel
 */
Storage.prototype.findOrCreateChannel = function (channelname, user) {
    var storage = this;
    return new Promise(function (resolve, reject) {
        storage.Channel.findOrCreate({
            name: channelname
        })
            .success(function (channel, created) {
                if (created) {
                    channel.associateUser(channel, user, []).then(function () {
                        logger.debug('Found channel: ' + channel);
                        resolve(channel);
                    }).
                    catch (function (err) {
                        reject(err);
                    });
                } else {
                    resolve(channel);
                }
            }).error(function (err) {
                reject(err);
            });
    });
};

module.exports = Storage;