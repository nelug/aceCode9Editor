'use strict';

var gulp = require('gulp'),
   connect = require('gulp-webserver'),
   jshint = require('gulp-jshint'),
   inject = require('gulp-inject'),
   wiredep = require('wiredep').stream,
   gulpif = require('gulp-if'),
   minify = require('gulp-minify-css'),
   minhtml = require('gulp-minify-html'),
   useref = require('gulp-useref'),
   uglify = require('gulp-uglify'),
   uncss = require('gulp-uncss'),
   del = require('del'),
   cache = require('gulp-ng-template'),
   imgmin = require('gulp-imagemin'),
   svgo = require('imagemin-svgo'),
   png = require('imagemin-optipng'),
   jpeg = require('imagemin-jpegtran'),
   gutil = require('gulp-util'),
   jshintfileoutput = require('gulp-jshint-html-reporter');

//DESAROLLO#############################################################
gulp.task('server', function() {
   gulp.src('app')
      .pipe(connect({
         host: '127.0.0.1',
         port: '8080',
         livereload: {
            enable: true,
            filter: function(filename) {
               if (filename.match(/.js$/)) {
                  return false;
               }

               return true;
            }
         },
         fallback: 'index.html',
         proxies: [{
            source: '/UMGRestFull-1.0/v1/',
            target: 'http://192.168.124.231:8080/UMGRestFull-1.0/v1/'
         }],
         open: true
      }));
});

//Tarea para buscar estilos y javascript en los archivos del proyecto para inyectarlos en pagina principal
gulp.task('inyeccion', function() {
   var sources = gulp.src(['./app/js/**/*.js', './app/css/**/*.css', '!./app/css/creador*.css']);
   return gulp.src('index.html', {
         cwd: './app'
      })
      .pipe(inject(sources, {
         read: false,
         ignorePath: '/app'
      }))
      .pipe(gulp.dest('./app'));
});

//Tarea para inyectar las librerias de terceros instaladas mediante bower
gulp.task('dependencia', function() {
   return gulp.src('./app/index.html')
      .pipe(wiredep({
         directory: './app/lib'
      }))
      .pipe(gulp.dest('./app'));
});

//Tarea para busqueda de errores y mostrarlos en pantalla
gulp.task('analizar', function() {
   return gulp.src(['./app/js/**/*.js'])
      .pipe(jshint('.jshintrc'))
      .pipe(jshint.reporter('jshint-stylish'))
      .pipe(jshint.reporter('gulp-jshint-html-reporter', {
         filename: 'analisis/resultado-analisis.html',
         createMissingFolders : true
      }));
});

//Task para convertir las plantillas en templates
gulp.task('template', function() {
   return gulp.src('./app/html/**/*.html')
      .pipe(minhtml())
      .pipe(cache({
         prefix: 'html/',
         moduleName: 'templates',
         standalone: true,
         filePath: 'templates.js'
      }))
      .pipe(gulp.dest('./app/js'));
});


//Tarea que vigila cambios en los archivos html, css y ejecuta la tarea de actualizacion del navegdor
gulp.task('vigilar', function() {
   gulp.watch(['./app/css/**/*.css'], ['inyeccion']);
   gulp.watch(['./app/js/**/*.js', '!./app/js/templates.js'], ['inyeccion']);
   gulp.watch(['./app/js/**/*.js', './gulpfile.js'], ['analizar']);
   gulp.watch(['./app/html/**/*.html'], ['template']);
   gulp.watch(['./bower.json'], ['dependencia']);
});

//Tarea default para gulp
gulp.task('desarrollo', ['server', 'vigilar']);


//Tarea para limpiar directorio dist
gulp.task('limpiar', function() {
   return del(['./dist/**/*.*']);
});

//Tarea para comprimmir los archivos js y css, para luego copiarlos a la carpeta dist
gulp.task('comprimir', ['copiar'], function() {
   return gulp.src('./app/index.html')
      .pipe(useref.assets())
      .pipe(gulpif('*.js', uglify({
         mangle: true
      })).on('error', gutil.log))
      .pipe(gulpif('*.css', minify()))
      .pipe(gulp.dest('./dist'));
});

//Tarea para copiar index.html a la carpeta dist
gulp.task('copiar', ['limpiar'], function() {
   gulp.src('./app/img/*.svg')
      .pipe(svgo()())
      .pipe(gulp.dest('dist/img'));

   gulp.src('./app/img/*.png')
      .pipe(png({
         optimizationLevel: 3
      })())
      .pipe(gulp.dest('dist/img'));

   gulp.src('./app/img/*.jpg')
      .pipe(jpeg({
         progressive: true
      })())
      .pipe(gulp.dest('dist/img'));

   gulp.src('./app/lib/bootstrap/fonts/*.{ttf,woff,eof,svg}')
      .pipe(gulp.dest('./app/fonts'));

   return gulp.src('./app/index.html')
      .pipe(useref())
      .pipe(minhtml())
      .pipe(gulp.dest('./dist'));
});

//Tarea para quitar css que no se utiliza
gulp.task('uncss', function() {
   return gulp.src('./dist/css/style.min.css')
      .pipe(uncss({
         html: [
            './app/index.html',
            './app/html/**/*.html'
         ]
      }))
      .pipe(minify())
      .pipe(gulp.dest('./dist/css/style.min.css'));
});

//Tarea para compilar la aplicacion
gulp.task('compilar', ['comprimir']);
