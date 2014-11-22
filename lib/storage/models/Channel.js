'use strict';

var Promise = require('bluebird'),
    _ = require('lodash'),
    logger = require('../../core/Logger')('storage');

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
            allowNull: false,
            onDelete: 'cascade'
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
                as: 'subscribers',
                onDelete: 'cascade'
            });
            models.Channel.hasMany(models.ChannelEvent, {
                as: 'events',
                onDelete: 'cascade'
            });
            models.Channel.hasMany(models.ChannelConf, {
                as: 'configurations',
                onDelete: 'cascade'
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
                                id : user.id
                            }
                        }).then(function(users){
                            logger.debug('found users: '+ JSON.stringify(users));

                            // user is already part of this room
                            if (users && users.length > 0) {
                                var channelSubscriber = users[0];

                                // update data
                                // channelSubscriber.ChannelSub.affiliation = options.affiliation;
                                channelSubscriber.ChannelSub.substate = options.substate;
                                channelSubscriber.ChannelSub.save();

                                resolve(channelSubscriber);
                            } else {
                                logger.debug('add user as new subscriber ' + user.jid);
                                // add user to room
                                self.addSubscriber(user, options).success(function (subscriber) {
                                    resolve(subscriber);
                                }).catch(reject);
                            }
                        }).catch(reject);
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
                                id : user.id
                            }
                        }).then(function(users){

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

                        }).catch(reject);
                    }
                });
            },
            isSubscriber: function (user) {
                var self = this;
                
                // checkout if the current user is member
                return self.getSubscribers({
                    where: {
                        id : user.id
                    }
                }).then(function(users){
                    return new Promise(function(resolve, reject) {
                    logger.debug('found users: ' + JSON.stringify(users));

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

    return Channel;
};