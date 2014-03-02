'use strict';

module.exports = function (sequelize, DataTypes) {

    var Channel = sequelize.define('Channel', {
        uuid: {
            type: DataTypes.UUID,
            unique: true,
            validate: {
                isUUID: 4
            }
        },
        xmppid: {
            type: DataTypes.STRING,
            unique: true,
            validate: {
                notNull: true
            }
        },
        name: {
            type: DataTypes.STRING,
            validate: {}
        }
    }, {
        associate: function (models) {
            models.Channel.hasMany(models.User, { through: models.ChannelSubsription });
            models.Channel.hasMany(models.Event);
            models.Channel.hasMany(models.ChannelConfiguration, {as: 'Configuration' });
        }
    });

    return Channel;
};