'use strict';

module.exports = function (sequelize, DataTypes) {

    var RoomMessage = sequelize.define('RoomMessage', {
        content: {
            type: DataTypes.TEXT,
            validate: {}
        }
    }, {
        associate: function (models) {

        }
    });

    return RoomMessage;
};