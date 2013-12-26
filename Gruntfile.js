module.exports = function (grunt) {
    'use strict';

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                './scripts/{,*/}*.js',
                'test/spec/{,*/}*.js'
            ]
        },
        browserify: {
            test: {
                src  : ['test/test.js'],
                dest : '.tmp/index.js',
                options : {
                    debug : true
                }
            }
        },
        bump: {
            options: {
                files              : ['package.json'],
                updateConfigs      : [],
                commit             : true,
                commitMessage      : 'Release v%VERSION%',
                commitFiles        : ['-a'],
                createTag          : true,
                tagName            : 'v%VERSION%',
                tagMessage         : 'Version %VERSION%',
                push               : true,
                pushTo             : 'git://github.com/rvangundy/generator-basic.git',
                gitDescribeOptions : '--tags --always --abbrev=1 --dirty=-d'
            }
        },
        mocha: {
            options : {
                run : true
            },
            test: {
                src: ['test/test.html'],
            }
        }
    });

    grunt.registerTask('test', [
        'jshint',
        'browserify',
        'mocha'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'browserify'
    ]);

    grunt.registerTask('release', [
        'test',
        'bump'
    ]);
