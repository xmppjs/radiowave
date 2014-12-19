'use strict';

module.exports = function (sequelize, DataTypes) {

    var ChannelEvent = sequelize.define('ChannelEvent', {
        content: {
            type: DataTypes.TEXT,
            validate: {}
        }
    }, {});

    return ChannelEvent;
};