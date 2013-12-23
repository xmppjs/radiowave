'use strict';

var featureGenerator = require('../FeatureGenerator');

module.exports = function(grunt) {
    grunt.registerTask('genfeatures', 'Generate features.js from features.xml.', function() {

        var done = this.async();
        var options = this.options();
        var globs = [];

        // Use the Grunt files format if the `files` option isn't set
        if (!options.files) {
            this.files.forEach(function(glob) {
                globs = globs.concat(glob.orig.src);
            });
            options.files = globs;
        }

        grunt.log.writeln(JSON.stringify(options.files));

        if (options && options.files) {
            for (var i = 0,  l = options.files.length; i < l; i++) {
            	grunt.log.writeln('Generate feature javascript: ' + options.files[i]);
                featureGenerator.generateFeatureJs(options.files[i]);
            };
        }

        done(0);
        
    });
};
