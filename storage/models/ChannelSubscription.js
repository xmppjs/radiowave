'use strict';

module.exports = function (sequelize, DataTypes) {

    var ChannelSubscription = sequelize.define('ChannelSubscription', {
        affiliation: {
            type: DataTypes.STRING,
        }
    }, {
        associate: function (models) {

        }
    });

    return ChannelSubscription;
};