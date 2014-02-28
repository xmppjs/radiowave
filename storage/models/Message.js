'use strict';

module.exports = function (sequelize, DataTypes) {

    var Message = sequelize.define('Message', {
        content: {
            type: DataTypes.TEXT,
            validate: {}
        }
    }, {
        associate: function (models) {

        }
    });

    return Message;
};