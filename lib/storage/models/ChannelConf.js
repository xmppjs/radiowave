'use strict';

module.exports = function (sequelize, DataTypes) {

  var ChannelConf = sequelize.define('ChannelConf', {
    key: {
      type: DataTypes.STRING,
      validate: {}
    },
    value: {
      type: DataTypes.TEXT,
      validate: {}
    }
  }, {});

  return ChannelConf;
};
