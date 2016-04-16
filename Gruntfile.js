module.exports = function(grunt) {

    grunt.initConfig({
        watch: {
            files: ['**/*.coffee', 'frontend/**/*.coffee'],
            tasks: ['coffee']
        },
        coffee: {
            options: {
                bare: true
            },
            glob_to_multiple: {
                expand: true,
                flatten: true,
                src: ['coffee/backend/**/*.coffee'],
                dest: 'build',
                ext: '.js'
            },
            compile: {
                files: {
                    'app.js': 'coffee/app.coffee',
                    'build/frontend/public/js/authentication.js': 'coffee/frontend/authentication.coffee'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['watch']);

};