'use strict';

module.exports = function(grunt) {

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
            allFiles: ['gruntfile.js', 'storage/**/*.js', 'auth/**/*.js', 'config/**/*.js', 'core/**/*.js', 'net/**/*.js', 'router/**/*.js', 'xep/**/*.js'],
            options: {
                jshintrc: '.jshintrc',
            }
        },
        mochacli: {
            all: ['test/*.js'],
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
                files: ['xep/Xep0030-disco/features.xml', 'xep/Xep0060-pubsub/features.xml', 'xep/Xep0045-muc/features.xml']
            }
        }
    });

    // Configure tasks.
    grunt.registerTask('default', ['test']);
    grunt.registerTask('test', ['mochacli', 'jshint', 'retire']);

};
