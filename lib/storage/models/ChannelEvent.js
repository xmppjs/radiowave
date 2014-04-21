'use strict';

module.exports = function (sequelize, DataTypes) {

    var ChannelEvent = sequelize.define('ChannelEvent', {
        content: {
            type: DataTypes.TEXT,
            validate: {}
        }
    }, {
        associate: function (models) {

        }
    });

    return ChannelEvent;
};