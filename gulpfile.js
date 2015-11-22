'use strict';

var gulp = require('gulp'),
    wiredep = require('wiredep').stream,
    sass = require('gulp-sass'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    htmlmin = require('gulp-htmlmin'),
    gutil = require('gulp-util'),
    ftp = require( 'vinyl-ftp' ),
    clean = require('gulp-clean'),
    rename = require('gulp-rename'),
    useref = require('gulp-useref'),
    autoprefixer = require('gulp-autoprefixer'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-minify-css');

// clean 
gulp.task('clean', function () {
    gulp.src('./dist', {read: false})
        .pipe(clean());
});

/*
// html
gulp.task('html', function () {
    gulp.src('./app/index.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest('dist'));
});
*/

// images
gulp.task('images', function(){
    gulp.src('./app/images/**/*')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('./dist/img/'));
});

// fonts
gulp.task('fonts', function(){
    gulp.src('./app/fonts/**/*')
        .pipe(gulp.dest('./dist/fonts/'));
});

// js
gulp.task('js', function(){
    gulp.src('./app/javascripts/**/*')
        .pipe(gulp.dest('./dist/js/'));
});

// css


// scss
gulp.task('scss', function () {
    return gulp.src('./app/stylesheets/scss/style.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 30 versions'],
            cascade: false
        }))
        .pipe(rename("style.css"))
        .pipe(gulp.dest('./app/stylesheets/'));
});

// ftp
gulp.task( 'deploy', function() {

    var conn = ftp.create( {
        host:     'volkov97.com',
        user:     'u103446589',
        password: 'KJ7P3756K',
        parallel: 10,
        log:      gutil.log
    } );

    var globs = [
        'dist/**/*'
    ];

    // using base = '.' will transfer everything to /public_html correctly
    // turn off buffering in gulp.src for best performance

    return gulp.src( globs, { base: './dist/', buffer: false} )
        .pipe( conn.newer( '/public_html' ) ) // only upload newer files
        .pipe( conn.dest( '/public_html' ) );

} );

// wiredep bower
gulp.task('bower', function () {
  gulp.src('./views/layout_work.hbs')
    .pipe(wiredep({
      optional: 'configuration',
      goes: 'here'
    }))
    .pipe(gulp.dest('./views'));
});

// default
gulp.task('default', ['html', 'images']);

// make static files to dist
gulp.task('static', ['fonts', 'images', 'scss'], function(){
    var assets = useref.assets();
 
    gulp.src('./views/layout_work.hbs')
        .pipe(assets)
        .pipe(assets.restore())
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(useref())
        .pipe(gulpif('layout_work.hbs', rename("layout.hbs")))
        .pipe(gulp.dest('./dist'));
});