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
        }).then(function (user) {
            if (user) {
                resolve(user);
            } else {
                reject('could not find user ');
            }
        }).catch(function (err) {
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
            where : {
                jid: jid
            }
        }).then(function (user) {
            if (user) {
                resolve(user);
            }
            // this should never happen
            else {
                reject('could not find user ');
            }
        }).catch(function (err) {
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
        }).then(function (room) {
            if (room) {
                resolve(room);
            } else {
                reject();
            }
        }).catch(function (err) {
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
        }).then(function (ownerRooms) {
            logger.debug('found rooms ' + JSON.stringify(ownerRooms));
            if (ownerRooms && ownerRooms.length >= 1) {
                resolve(ownerRooms[0]);
            } else {
                reject();
            }
        }).catch(function () {
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
            }).then(function (ownerRooms) {
                resolve(ownerRooms);
            }).catch(function () {
                reject();
            });

        }).catch(function () {
            reject();
        });

    });
};

Storage.prototype.addRoom = function (user, data) {
    var storage = this;

    if (!user || !data) {
        throw new Error('no user or data');
        return;
    }

    logger.debug('add room ' + data.name + ' to user user' + JSON.stringify(user));

    return storage.Room.create({
        name: data.name,
        subject: data.subject,
        description: data.description
    }).then(function (room) {
    
        return room.addMember(user, {
            role: storage.RoomMembers.Role.Moderator,
            affiliation: storage.RoomMembers.Affiliation.Owner,
            nickname: ''
        })

    })

};

Storage.prototype.updateRoom = function (room, data) {

    if (!room ||  !data) {
        throw new Error('no room or data');
    }

    var updates = {};

    if (data.subject) {
        updates.subject = data.subject;
    }

    if (data.description) {
        updates.description = data.description;
    }

    logger.debug('update room ' + room.name);

    return room.updateAttributes(updates)
};

Storage.prototype.delRoom = function (room) {
    var storage = this;

    if (!room) {
        throw new Error('no room');
    }

    logger.debug('remove room ' + room.name);

    // remove members because cascading delete does not work for through tables
    return storage.RoomMembers.destroy({
        RoomId: room.id
    }, {}).then(function(){
        // delete room
        return room.destroy()
    })
    
};

Storage.prototype.addMember = function (room, user) {

    logger.debug('add member');

    var storage = this;

    if (!room ||  !user) {
        throw new Error('no room or user');
        return;
    }

    return room.addMember(user, {
        role: storage.RoomMembers.Role.Participant,
        affiliation: storage.RoomMembers.Affiliation.Member,
        nickname: '',
        state : storage.RoomMembers.State.Accepted
    })

};

Storage.prototype.inviteMember = function (data) {
    // TODO do not overwrite existing membership with invitation

    logger.debug('invite member');

    var storage = this;
    return new Promise(function (resolve, reject) {

        if (!data || !data.room || !data.invitee || !data.inviter) {
            throw new Error('room or invitee is missing');
            return;
        }

        logger.debug('compare ' + data.invitee.jid + ' ' + data.inviter.jid );
        if (data.invitee.jid === data.inviter.jid) {
            throw new Error('cannot invite inviter');
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
            }).then(function () {
                // added member to room
                storage.emit('invite', {
                    room: room,
                    invitee: data.invitee,
                    inviter: data.inviter,
                    reason: data.reason
                });
                resolve();
            }).catch(function (err) {
                logger.error(err);
                reject(err);
            });
        });
    });
};

Storage.prototype.declineMembership = function (room, invitee, inviter, reason) {
    var storage = this;
    return new Promise(function (resolve, reject) {

        if (!room ||  !invitee) {
            reject('no room or invitee');
            return;
        }

        // checkout if the current user is member
        room.getMembers({
            where: {
                userid : invitee.id
            }
        }).then(function(users){
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
        }).catch(function (err) {
            logger.error(err);
            reject(err);
        });
    });
};

Storage.prototype.removeMember = function (room, user) {
    
    if (!room ||  !user) {
        throw new Error('no room or user');
        return;
    }

    return room.removeMember(user);
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
        }).then(function (ownerChannels) {
            if (ownerChannels && ownerChannels.length >= 1) {
                resolve(ownerChannels[0]);
            } else {
                reject('owner channels are missing');
            }
        }).catch(function (err) {
            reject(err);
        });
    });
},

Storage.prototype.getChannels = function (user, type) {
    var storage = this;

    if (!user) {
        reject('no user');
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
    return user.getChannels({
        where: {
            affiliation: affiliation
        }
    })
};

Storage.prototype.addChannel = function (user, data) {
    var storage = this;
    
    if (!user) {
        throw new Error('no user');
        return;
    }

    return storage.Channel.create({
        name: data.name
    }).then(function (channel) {
        return user.addChannel(channel, {
            affiliation: storage.ChannelSub.Affiliation.Owner,
            substate: storage.ChannelSub.SubState.Member
        })
    })

};

Storage.prototype.delChannel = function (channel) {
    var storage = this;
    
    if (!channel) {
        throw new Error('no channel');
        return;
    }

    // remove subscribers because cascading delete does not work for through tables
    storage.ChannelSub.destroy({
        ChannelId: channel.id
    }, {});

    // delete channel
    return channel.destroy()
};

Storage.prototype.findChannel = function (channelname) {
    var storage = this;
    return storage.Channel.find({
        where: {
            name: channelname
        }
    })
};

/**
 * finds or creates a channel
 */
Storage.prototype.findOrCreateChannel = function (channelname, user) {
    var storage = this;
    return new Promise(function (resolve, reject) {
        storage.Channel.findOrCreate({
            where: {
                name: channelname
            }
        })
            .spread(function (channel, created) {
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
            }).catch(function (err) {
                reject(err);
            });
    });
};

module.exports = Storage;