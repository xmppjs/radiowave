'use strict';

var Promise = require('bluebird');

module.exports = function (sequelize, DataTypes) {

    var Room = sequelize.define('Room', {
        // room identifier
        uuid: {
            type: DataTypes.UUID,
            unique: true,
            validate: {
                isUUID: 4
            }
        },
        // xmpp room name
        name: {
            type: DataTypes.STRING,
            unique: true,
            validate: {}
        },
        title: {
            type: DataTypes.STRING,
            validate: {}
        }
    }, {
        associate: function (models) {
            models.Room.hasMany(models.User, {
                through: models.RoomMembers
            });
            models.Room.hasMany(models.Message);
            models.Room.hasMany(models.RoomConfiguration, {
                as: 'Configuration'
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

                var options = {
                    role: 'moderator',
                    affiliation: 'owner',
                    nickname: 'jj'
                };

                var self = this;
                return new Promise(function(resolve, reject) {

                    // checkout if the current user is member
                    self.getUsers({
                        where: {
                            userid : user.id
                        }
                    }).success(function(users){

                        if (users && users.length > 0) {
                            var user = users[0];

                            // update data
                            user.RoomMembers.role = options.role;
                            user.RoomMembers.affiliation = options.affiliation;
                            user.RoomMembers.nickname = options.nickname;
                        } else {
                            // add user to room
                            user.addRoom(options);
                        }
                    }).error(function(err){
                        reject(err);
                    });
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
                    self.getUsers({
                        where: {
                            userid : user.id
                        }
                    }).success(function(users){

                        if (users && users.length > 0) {
                            var user = users[0];
                            if (user) {
                                resolve();
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
                    self.getUsers({
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