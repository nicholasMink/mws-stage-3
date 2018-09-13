var gulp = require('gulp');
var babelify = require('babelify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
const imagemin = require('gulp-imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');

gulp.task('styles', function() {
  return gulp.src('./scss/styles.scss')
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(gulp.dest('../dist/css'))
    .pipe(browserSync.stream());
});

gulp.task('indexScripts', function() {
  browserify(['js/controller.js', 'js/main.js', 'js/dbhelper.js'])
    .transform(babelify.configure({
      presets: ['env']
    }))
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init())
    // ***********************************************************************************************************
    .pipe(uglify()) // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Uncomment for perfomance !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // ***********************************************************************************************************
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest('../dist/js'));
});

gulp.task('restaurantScripts', function() {
  browserify(['js/controller.js', 'js/restaurant_info.js', 'js/dbhelper.js'])
    .transform(babelify.configure({
      presets: ['env']
    }))
    .bundle()
    .pipe(source('restaurant.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init())
    // ***********************************************************************************************************
    .pipe(uglify()) // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Uncomment for perfomance !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // ***********************************************************************************************************
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest('../dist/js'))
});

gulp.task('watch', function() {
  gulp.watch(['./service-worker.js', './js/**/*.js'], ['indexScripts', 'restaurantScripts']);
  gulp.watch(['./scss/styles.scss'], ['styles']);
});

gulp.task('serve', ['styles'], function() {
  browserSync.init({
    server: '../dist/',
    browser: 'chrome'
  });

  gulp.watch('../dist/*.html').on('change', browserSync.reload);
  gulp.watch('../dist/js/**/*.js').on('change', browserSync.reload);
  gulp.watch('../dist/css/*.css').on('change', browserSync.reload);

});

gulp.task('copy-files', function() {
  gulp.src(['./index.html', './restaurant.html', './manifest.json', './service-worker.js'])
    .pipe(gulp.dest('../dist'));
});

gulp.task('imagemin', function() {
  gulp.src('./img/**/*.*')
    .pipe(imagemin([
            imageminMozjpeg({
                quality: 66
            })
        ], {
      verbose: true
    }))
    .pipe(gulp.dest('../dist/img'))
});

gulp.task('dist', ['copy-files', 'imagemin', 'styles', 'indexScripts', 'restaurantScripts']);
gulp.task('default', ['copy-files', 'imagemin', 'indexScripts', 'restaurantScripts', 'watch', 'serve']);