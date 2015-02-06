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
      join: function (user, params, options) {
        logger.debug('user ' + JSON.stringify(user) + ' joins room ' + this.name);
        var self = this;
        options = options || {};

        // verify parameters
        if (!user ||  !params ||  !params.role ||  !params.affiliation || !params.nickname) {
          throw new Error('wrong parameters');
        } else {
          return self.getMembers({
            where: {
              'User.id': user.id
            }
          }, options).then(function (members) {
            logger.debug('found members: ' + JSON.stringify(members));

            // user is already part of this room
            if (members && members.length > 0) {
              var roomUser = members[0];
              logger.debug('user is already member: ' + JSON.stringify(roomUser))

              // update data
              // @see http://xmpp.org/extensions/xep-0045.html#roles-default
              switch (roomUser.RoomMember.affiliation) {

              case sequelize.model('RoomMember').Affiliation.Owner:
                roomUser.RoomMember.affiliation = sequelize.model('RoomMember').Affiliation.Owner;
                roomUser.RoomMember.role = sequelize.model('RoomMember').Role.Moderator;
                break;
              case sequelize.model('RoomMember').Affiliation.Admin:
                roomUser.RoomMember.affiliation = sequelize.model('RoomMember').Affiliation.Admin;
                roomUser.RoomMember.role = sequelize.model('RoomMember').Role.Moderator;
                break;
              default:
                roomUser.RoomMember.affiliation = sequelize.model('RoomMember').Affiliation.Participant;
                roomUser.RoomMember.role = sequelize.model('RoomMember').Role.Visitor;
                break;
              }

              roomUser.RoomMember.nickname = params.nickname;
              return roomUser.RoomMember.save(options).then(function () {
                return roomUser;
              })
            } else {
              logger.debug('add user as new member ' + user.jid);

              var opts = {
                'RoomMember.role': params.role,
                'RoomMember.affiliation': params.affiliation,
                'RoomMember.nickname': params.nickname
              }

              // add user to room
              return self.addMember(user, _.merge(options, opts)).then(function(){
                logger.debug('user added, retrieve updated user')
                return self.getMembers({
                  where: {
                    'User.id': user.id
                  }
                }, options)
              }).then(function(members){
                return members[0];
              })
            }
          })
        }
      },

      /**
       * leave the rum
       */
      leave: function (user, options) {
        return this.getMembers({
          where: {
            'User.id': user.id
          }
        }, options).then(function (members) {
          var roomUser = members[0];
          roomUser.RoomMember.role = sequelize.model('RoomMember').Role.None;
          roomUser.RoomMember.save()
        })
      },

      /**
       * verifies that the given user is a member of this room
       */
      isMember: function (user, options) {
        var self = this;

        // checkout if the current user is member
        return self.getMembers({
          where: {
            'User.id': user.id
          }
        }, options).then(function (users) {
          logger.debug('found users: ' + JSON.stringify(users));

          return new Promise(function (resolve, reject) {
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
      nickname: function (user, options) {
        var self = this;

        // checkout if the current user is member
        return self.getMembers({
          where: {
            'User.id': user.id
          }
        }, options).then(function (users) {
          return new Promise(function (resolve, reject) {
            var user = _.first(users)
            if (user) {
              resolve(user);
            } else {
              reject();
            }
          });
        })
      },

      addConfig : function (config, options) {
        var self = this;
        var promises = [];

        // iterate over attributes and add key values
        _.forEach(config, function(value, key) {

          promises.push(
            sequelize.model('RoomConfiguration').create({
              'key': key,
              'value': value
            }, options).then(function(configuration) {
              return self.addConfiguration(configuration, options);
            })
          );

        });

        return Promise.all(promises)
      },

      exportJSON: function () {

        var room = _.pick(this.toJSON(), ['name', 'subject', 'description', 'per_page', 'type']);

        // create members data 
        var owner = null;
        room['members'] = _.map(this.members, function (member) {
          if (member.RoomMember.affiliation === 'owner') {
            owner = member;
          }
          return {
            'name': member.name,
            'jid': member.jid,
            'nickname': member.RoomMember.nickname,
            'role': member.RoomMember.role,
            'affiliation': member.RoomMember.affiliation,
            'state': member.RoomMember.state
          }
        })

        // if we have information about the room
        if (owner && owner.jid) {
          room['owner'] = {
            'jid': owner.jid,
            'name': owner.name
          }
        }

        // export update information
        room['updatedAt'] = this.getDataValue('updatedAt').getTime()
        room['createdAt'] = this.getDataValue('createdAt').getTime()

        return room;
      }
    }
  });

  return Room;
};
