'use strict';

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    Sequelize = require('sequelize'),
    Promise = require('bluebird'),
    models = require('./models');

var winston = require('winston'),
    logger = winston.loggers.get('storage');

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
            resolve(user);
        }).error(function () {
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
            resolve(room);
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
};

Storage.prototype.addRoom = function (user, data) {
    var storage = this;
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

        room.updateAttributes(updates).success(function () {
            resolve();
        }).error(function (err) {
            reject(err);
        });
    });
};

Storage.prototype.delRoom = function (room) {
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
};

Storage.prototype.addMember = function (room, user) {
    var storage = this;
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

Storage.prototype.findChannel = function (channelname) {
    var self = this;
    return new Promise(function (resolve, reject) {
        self.storage.Channel.find({
            where: {
                name: channelname
            }
        }).success(function (channel) {
            console.log('Found channel: ' + channel);
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
    var self = this;
    return new Promise(function (resolve, reject) {
        self.storage.Channel.findOrCreate({
            name: channelname
        })
            .success(function (channel, created) {
                if (created) {
                    self.associateUser(channel, user, []).then(function () {
                        console.log('Found channel: ' + channel);
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