'use strict';

var Promise = require('bluebird'),
  _ = require('lodash'),
  logger = require('../../core/Logger')('storage');

module.exports = function (sequelize, DataTypes) {

  /**
   * @see http://xmpp.org/extensions/xep-0060.html#nodetypes
   */
  var NodeType = {
    'Leaf': 'leaf',
    'Collection': 'collection'
  };

  /**
   * @see http://xmpp.org/extensions/xep-0060.html#accessmodels
   */
  var AccessModel = {
    'Open': 'open',
    'Presence': 'presence',
    'Roaster': 'roaster',
    'Authorize': 'authorize',
    'Whitelist': 'whitelist'
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
    accessmodel: {
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
      subscribe: function (user, params, options) {
        var self = this;

        // verify parameters
        if (!user && !params && !params.affiliation && !params.substate) {
          throw new Error('wrong parameters');
        } else {
          // checkout if the current user is subscriber
          return self.getSubscribers({
            where: {
              id: user.id
            }
          }, options).then(function (subscribers) {
            logger.debug('found subscribers: ' + JSON.stringify(subscribers));

            // user is already part of this room
            if (subscribers && subscribers.length > 0) {
              var channelSubscriber = subscribers[0];

              // update data
              // channelSubscriber.ChannelSub.affiliation = params.affiliation;
              channelSubscriber.ChannelSub.substate = params.substate;
              return channelSubscriber.ChannelSub.save(options).then(function () {
                return channelSubscriber;
              })
            } else {
              logger.debug('add user as new subscriber ' + user.jid);
              // add user to room
              return self.addSubscriber(user, _.merge(options, params)).then(function(){
                logger.debug('user added, retrieve updated user')
                return self.getSubscribers({
                  where: {
                    'User.id': user.id
                  }
                }, options)
              }).then(function(subscriber){
                return subscriber[0];
              })
            }
          })
        }
      },
      unsubscribe: function (subscriber, options) {
        var self = this;

        // verify parameters
        if (!subscriber) {
          throw new Error('wrong parameters');
        } else {
          // checkout if the current user is subscriber
          return self.getSubscribers({
            where: {
              id: subscriber.id
            }
          }, options).then(function (subscribers) {

            // user is already part of this room
            if (subscribers && subscribers.length > 0) {
              var channelSubscriber = subscribers[0];

              channelSubscriber.ChannelSub.substate = 'none';
              return channelSubscriber.ChannelSub.save(options);

              // self.removeSubscriber(subscribers[0]);
              
            } else {
              throw new Error('no subscriber');
            }
          })
        }
      },
      isOwner : function (user, options) {
        return this.getSubscribers({
          where: {
            id: user.id,
            'ChannelSub.affiliation': sequelize.model('ChannelSub').Affiliation.Owner
          }
        }, options)
      },
      /**
       * verifies if the current user is member
       */
      isSubscriber: function (user, options) {
        return this.getSubscribers({
          where: {
            id: user.id
          }
        }, options).then(function (subscribers) {
          return new Promise(function (resolve, reject) {
            logger.debug('found subscribers: ' + JSON.stringify(subscribers));

            var subscriber = _.first(subscribers);
            if (subscriber) {
              resolve(subscriber);
            } else {
              reject();
            }

          });
        });
      },

      /**
       * set the configuration into the node
       */
      setConfig : function (config, options) {
        logger.debug('configuring node ' + this.name);

        config = config || [];
        options = options || {};
        var promises = [];
        var self = this;

        return new Promise(function(resolve, reject) {
          // overwrite configuration
          for (var j = 0; j < config.length; j++) {
            var key = config[j].key;
            var value = config[j].value;
            logger.debug('set configuration ' + self.name + ' key: ' + key + ' ' + value);
      
            // TODO: simplify Promise structure and remove functions generation in loop
            /* jshint ignore:start */
            promises.push(self.getConfigurations({
              where: {
                key: key
              }
            }, options).then(function (config) {
              // config exists
              if (config && config.length === 1) {
                var c = config[0];
                c.value = value;
                return c.save()
              } else {
                return sequelize.model('ChannelConf').create({
                  key: key,
                  value: value
                }, options).then(function (conf) {
                  return self.addConfiguration(conf, options);
                });
              }
            }));
            /* jshint ignore:end */
          }

          return Promise.all(promises).then(resolve).catch(reject);
        })
      }
    }
  });

  return Channel;
};
