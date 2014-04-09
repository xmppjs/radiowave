'use strict';

var Promise = require('bluebird');

module.exports = function (sequelize, DataTypes) {

    var Room = sequelize.define('Room', {
        // globally unique xmpp room name within one domain
        name: {
            type: DataTypes.STRING,
            unique: true,
            validate: {}
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
                through: models.RoomMembers,
                as: 'Members'
            });
            models.Room.hasMany(models.RoomMessage, {
                as: 'Messages'
            });
            models.Room.hasMany(models.RoomConfiguration, {
                as: 'Configurations'
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
                return new Promise(function(resolve, reject) {

                    // verify parameters
                    if (!user || !options || !options.role || !options.affiliation || !options.nickname) {
                        reject('wrong parameters');
                    } else {
                        // checkout if the current user is member
                        self.getMembers({
                            where: {
                                userid : user.id
                            }
                        }).success(function(users){
                            console.log('found users: '+ JSON.stringify(users));

                            // user is already part of this room
                            if (users && users.length > 0) {
                                var roomUser = users[0];

                                // update data
                                // roomUser.RoomMembers.role = options.role;
                                // roomUser.RoomMembers.affiliation = options.affiliation;
                                roomUser.RoomMembers.nickname = options.nickname;
                                roomUser.RoomMembers.save();

                                resolve(roomUser);
                            } else {
                                console.log('add user as new member ' + user.jid);
                                // add user to room
                                self.addMember(user, options).success(function (member) {
                                    resolve(member);
                                }).error(function(err){
                                    reject(err);
                                });
                            }
                        }).error(function(err){
                            reject(err);
                        });
                    }
                });
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
                return new Promise(function(resolve, reject) {
                    // checkout if the current user is member
                    self.getMembers({
                        where: {
                            UserId : user.id
                        }
                    }).success(function(users){
                        console.log('found users: ' + JSON.stringify(users));
                        if (users && users.length > 0) {
                            var user = users[0];
                            if (user) {
                                resolve(user);
                            } else {
                                reject();
                            }
                        } else {
                            reject();
                        }
                    }).error(function(err){
                        reject(err);
                    });
                });
            },

            /**
             * returns the nickname of a user for this specific
             * room.
             */
            nickname: function (user) {
                var self = this;
                return new Promise(function(resolve, reject) {
                    // checkout if the current user is member
                    self.getMembers({
                        where: {
                            userid : user.id
                        }
                    }).success(function(users){

                        if (users && users.length > 0) {
                            var user = users[0];
                            if (user) {
                                // return nickname
                                resolve(user.RoomMembers.nickname);
                            } else {
                                reject();
                            }
                        } else {
                            reject();
                        }
                    }).error(function(err){
                        reject(err);
                    });
                });
            }
        }
    });

    return Room;
};