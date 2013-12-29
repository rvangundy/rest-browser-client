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
            },
            release: {
                src : ['src/rest-client.js'],
                dest : 'index.js',
                options : {
                    standalone : ''
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
                pushTo             : '<%= pkg.repository.url %>',
                gitDescribeOptions : '--tags --always --abbrev=1 --dirty=-d'
            }
        },
        develop: {
            server: {
                file: './test/server.js',
                nodeArgs: ['--debug'],
                env: { NODE_ENV: 'development', PORT: 8000 }
            }
        },
        mocha: {
            options : {
                run : true
            },
            test: {
                src: ['test/index.html']
            }
        },
        watch: {
            options : {
                spawn : false
            },
            scripts: {
                files: ['src/*.js', 'test/*.js'],
                tasks: ['browserify', 'develop']
            }
        },
        open : {
            test : {
                path: 'test/index.html',
                app: 'Google Chrome'
            }
        }
    });

    grunt.registerTask('dev', [
        'jshint',
        'browserify:test',
        'develop',
        'open:test',
        'watch'
    ]);

    grunt.registerTask('test', [
        'jshint',
        'browserify:test',
        'develop',
        'mocha'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'browserify:release'
    ]);

    grunt.registerTask('release', [
        'test',
        'bump'
    ]);
};
