'use strict';

module.exports = function (grunt) {

  // Load the plugins.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-retire');

  // load xrocket tasks
  grunt.loadTasks('./grunt/tasks');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      allFiles: ['gruntfile.js', 'lib/**/*.js', 'bin/**/*.js'],
      options: {
        jshintrc: '.jshintrc',
      }
    },
    mochacli: {
      all: ['test/**/*.js'],
      options: {
        reporter: 'spec',
        ui: 'tdd'
      }
    },
    retire: {
      node: ['.'],
      options: {
        nodeOnly: true,
        verbose: true
      }
    },
    genfeatures: {
      options: {
        files: [
          'lib/components/Core/modules/Xep0030-disco/features.xml',
          'lib/components/Xep0060-pubsub/features.xml',
          'lib/components/Xep0045-muc/features.xml']
      }
    }
  });

  // Configure tasks.
  grunt.registerTask('default', ['test']);
  grunt.registerTask('test', ['mochacli', 'jshint', 'retire']);

};