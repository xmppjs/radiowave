'use strict';

module.exports = function (sequelize, DataTypes) {

  var RoomConfiguration = sequelize.define('RoomConfiguration', {
    key: {
      type: DataTypes.STRING,
      validate: {}
    },
    value: {
      type: DataTypes.TEXT,
      validate: {}
    }
  }, {});

  return RoomConfiguration;
};
