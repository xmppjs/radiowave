'use strict';

module.exports = function (sequelize, DataTypes) {

    var User = sequelize.define('User', {
        uid: {
            type: DataTypes.STRING,
            unique: true,
            validate: {}
        },
        name: {
            type: DataTypes.STRING,
            validate: {}
        },
        jid: {
            type: DataTypes.STRING,
            validate: {}
        }
    }, {
        associate: function (models) {

            // all users have a relationship
            // owner is only a special type of relationship
            // roles and affiliations are stored with association between
            // room and user

            // rooms where a user is member
            models.User.hasMany(models.Room, { through: models.RoomMembers });

            // channels where a user is subscriber
            models.User.hasMany(models.Channel, { through: models.ChannelSubscribers });

            // roaster
            models.User.hasMany(models.User, {as: 'Roaster' , through: models.Roaster});

        }
    });

    return User;
};
