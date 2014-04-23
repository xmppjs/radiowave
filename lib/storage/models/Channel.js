'use strict';

var Promise = require('bluebird');

module.exports = function (sequelize, DataTypes) {

    /**
     * @see http://xmpp.org/extensions/xep-0060.html#nodetypes
     */
    var NodeType = {
        'Leaf' : 'leaf',
        'Collection' : 'collection'
    };

    /**
     * @see http://xmpp.org/extensions/xep-0060.html#accessmodels
     */
    var AccessModel = {
        'Open' : 'open',
        'Presence' : 'presence',
        'Roaster' : 'roaster',
        'Authorize' : 'authorize',
        'Whitelist' : 'whitelist'
    };

    var Channel = sequelize.define('Channel', {
        // name must be globally unique
        name: {
            type: DataTypes.STRING,
            unique: true,
            validate: {
                notNull: true
            }
        },
        nodetype: {
            type: DataTypes.ENUM(
                NodeType.Leaf,
                NodeType.Collection
            )
        },
        accessmodel : {
            type: DataTypes.ENUM(
                AccessModel.Open,
                AccessModel.Presence,
                AccessModel.Roaster,
                AccessModel.Authorize,
                AccessModel.Whitelist
            )
        }
    }, {
        associate: function (models) {

            models.Channel.hasMany(models.User, {
                through: models.ChannelSub,
                as: 'Subscribers'
            });
            models.Channel.hasMany(models.ChannelEvent, {
                as: 'Events'
            });
            models.Channel.hasMany(models.ChannelConf, {
                as: 'Configurations'
            });
        },
        classMethods: {
            NodeType: NodeType,
            AccessModel: AccessModel
        },
        instanceMethods: {
            subscribe: function (user, options) {
                var self = this;
                return new Promise(function(resolve, reject) {

                    // verify parameters
                    if (!user && !options && !options.affiliation && !options.substate) {
                        reject('wrong parameters');
                    } else {
                        // checkout if the current user is subscriber
                        self.getSubscribers({
                            where: {
                                UserId : user.id
                            }
                        }).success(function(users){
                            console.log('found users: '+ JSON.stringify(users));

                            // user is already part of this room
                            if (users && users.length > 0) {
                                var channelSubscriber = users[0];

                                // update data
                                // channelSubscriber.ChannelSub.affiliation = options.affiliation;
                                channelSubscriber.ChannelSub.substate = options.substate;
                                channelSubscriber.ChannelSub.save();

                                resolve(channelSubscriber);
                            } else {
                                console.log('add user as new subscriber ' + user.jid);
                                // add user to room
                                self.addSubscriber(user, options).success(function (subscriber) {
                                    resolve(subscriber);
                                }).error(function(err){
                                    reject(err);
                                });
                            }
                        }).error(reject);
                    }
                });
            },
            unsubscribe: function (subscriber) {
                var self = this;
                return new Promise(function(resolve, reject) {
                    // verify parameters
                    if (!subscriber) {
                        reject('wrong parameters');
                    } else {
                        // checkout if the current user is subscriber
                        self.getSubscribers({
                            where: {
                                UserId : subscriber.id
                            }
                        }).success(function(users){

                            // user is already part of this room
                            if (users && users.length > 0) {
                                var channelSubscriber = users[0];

                                channelSubscriber.ChannelSub.substate = 'none';
                                channelSubscriber.ChannelSub.save();

                                // self.removeSubscriber(users[0]);
                                resolve();
                            } else {
                                reject('no subscriber');
                            }

                        }).error(reject);
                    }
                });
            },
            isSubscriber: function (user) {
                var self = this;
                return new Promise(function(resolve, reject) {
                    // checkout if the current user is member
                    self.getSubscribers({
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
                    }).error(reject);
                });
            }
        }
    });

    return Channel;
};