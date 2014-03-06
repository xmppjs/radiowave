'use strict';

module.exports = function (sequelize, DataTypes) {

    var Event = sequelize.define('Event', {
        content: {
            type: DataTypes.TEXT,
            validate: {}
        }
    }, {
        associate: function (models) {

        }
    });

    return Event;
};