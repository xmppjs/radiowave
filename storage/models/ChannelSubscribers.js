'use strict';

module.exports = function (sequelize, DataTypes) {

    var ChannelSubscribers = sequelize.define('ChannelSubscribers', {
        affiliation: {
            type: DataTypes.STRING,
        }
    }, {
        associate: function (models) {

        }
    });

    return ChannelSubscribers;
};