"use strict";

var bunyan = require('bunyan');

// use environment variables LOGSTASH_HOST and 
// LOGSTASH_PORT to submit logs to logstash via udp

var config = {
  name: 'oauth',
  streams: [{
    level: 'debug',
    stream: process.stdout
  }],
  level: 'debug'
};

if (process.env.LOGSTASH_HOST && process.env.LOGSTASH_PORT) {
  console.log('logstash enabled');
  config.streams.push({
    level: 'debug',
    type: "raw",
    stream: require('bunyan-logstash-tcp').createStream({
      host: process.env.LOGSTASH_HOST,
      port: process.env.LOGSTASH_PORT
    })
  });
} else {
  console.log('logstash not enabled');
}

var log = bunyan.createLogger(config);

function logger(name) {
  return log.child({
    widget_type: name
  });
}

module.exports = logger;
