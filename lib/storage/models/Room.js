'use strict';

var Promise = require('bluebird'),
    _ = require('lodash'),
    logger = require('../../core/Logger')('storage');

module.exports = function (sequelize, DataTypes) {

    var Room = sequelize.define('Room', {
        // globally unique xmpp room name within one domain
        name: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            onDelete: 'cascade'
        },
        subject: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.TEXT
        }
    }, {
        associate: function (models) {
            models.Room.hasMany(models.User, {
                through: models.RoomMember,
                as: 'members',
                onDelete: 'cascade'
            });
            models.Room.hasMany(models.RoomMessage, {
                as: 'messages',
                onDelete: 'cascade'
            });
            models.Room.hasMany(models.RoomConfiguration, {
                as: 'configurations',
                onDelete: 'cascade'
            });
        },
        instanceMethods: {

            /**
             * Join will:
             * - add a membership if not already established
             * - verify that the membership is properly, if the user
             *   is already a member
             * - possibly reset the new nickname
             */
            join: function (user, options) {

                var self = this;

                // verify parameters
                if (!user || !options || !options.role || !options.affiliation || !options.nickname) {
                    throw new Error('wrong parameters');
                } else {
                    // checkout if the current user is member
                    return self.getMembers({
                        where: {
                            UserId : user.id
                        }
                    }).then(function(users){
                        logger.debug('found users: '+ JSON.stringify(users));

                        // user is already part of this room
                        if (users && users.length > 0) {
                            var roomUser = users[0];

                            // update data
                            // roomUser.RoomMember.role = options.role;
                            // roomUser.RoomMember.affiliation = options.affiliation;
                            roomUser.nickname = options.nickname;
                            return roomUser.save();
                        } else {
                            logger.debug('add user as new member ' + user.jid);
                            // add user to room
                            return self.addMember(user, options).then(function (member) {

                                // manual set RoomMember because sequelize is not doing it
                                if (!member) {
                                    member = {};
                                }

                                member.role = options.role;
                                member.affiliation = options.affiliation;
                                member.nickname = options.nickname;
                                
                            })
                        }
                    })
                }
            },

            /**
             * leave the rum
             */
            leave: function (user) {
                return new Promise(function(resolve, reject) {
                    // don't do anything for now
                    resolve();
                });
            },

            /**
             * verifies that the given user is a member of this room
             */
            isMember: function (user) {
                var self = this;
                
                // checkout if the current user is member
                return self.getMembers({
                    where: {
                        "User.id" : user.id
                    }
                }).then(function(users){
                    logger.debug('found users: ' + JSON.stringify(users));
                    
                    return new Promise(function(resolve, reject) {
                        var user = _.first(users)        
                        if (user) {
                            resolve(user);
                        } else {
                            reject();
                        }
                    });
                })
            },

            /**
             * returns the nickname of a user for this specific
             * room.
             */
            nickname: function (user) {
                var self = this;
                
                // checkout if the current user is member
                return self.getMembers({
                    where: {
                        UserId : user.id
                    }
                }).then(function(users){
                    return new Promise(function(resolve, reject) {
                        var user = _.first(users)        
                        if (user) {
                            resolve(user);
                        } else {
                            reject();
                        }
                    });
                })
            }
        }
    });

    return Room;
};