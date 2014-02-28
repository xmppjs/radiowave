'use strict';

module.exports = function (sequelize, DataTypes) {

    var RoomMembers = sequelize.define('RoomMembers', {
        role: {
            type: DataTypes.STRING
        },
        affiliation: {
            type: DataTypes.STRING,
        }
    }, {
        associate: function (models) {

        }
    });

    return RoomMembers;
};