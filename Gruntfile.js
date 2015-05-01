'use strict';

module.exports = function (grunt) {

  // Load the plugins.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-retire');
  grunt.loadNpmTasks('grunt-mocha-istanbul')

  // load radiowave tasks
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
    'mocha_istanbul': {
      coveralls: {
        src: 'test',
        options: {
          coverage: true,
          legend: true,
          /* check: {
            lines: 90,
            statements: 90
          }, */
          root: './lib',
          reportFormats: [ 'lcov', 'html' ]
        }
      }
    },
    generatefeatures: {
      options: {
        files: [
          'lib/components/Core/modules/Xep0030-disco/features.xml',
          'lib/components/Xep0060-pubsub/features.xml',
          'lib/components/Xep0045-muc/features.xml'
        ]
      }
    }
  });

  grunt.event.on('coverage', function(lcov, done){
    require('coveralls').handleInput(lcov, function(error) {
      if (error) {
        console.log(error)
        return done(error)
      }
      done()
    })  
  })

  // Configure tasks.
  grunt.registerTask('default', ['test']);
  grunt.registerTask('coveralls', ['mocha_istanbul:coveralls'])
  grunt.registerTask('test', ['mochacli', 'jshint', 'retire', 'coveralls']);

};