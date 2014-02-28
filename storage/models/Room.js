'use strict';

module.exports = function (sequelize, DataTypes) {

    var Room = sequelize.define('Room', {
        uuid: {
            type: DataTypes.UUID,
            unique: true,
            validate: {
                isUUID: 4
            }
        },
        name: {
            type: DataTypes.STRING,
            validate: {}
        }
    }, {
        associate: function (models) {
            models.Room.hasMany(models.User, { through: models.RoomMembers });
            models.Room.hasMany(models.Message);
            models.Room.hasMany(models.RoomConfiguration, {as: 'Configuration' });
        }
    });

    return Room;
};