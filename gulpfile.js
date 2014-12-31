var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var concat = require('gulp-concat');
var cached = require('gulp-cached');
var remember = require('gulp-remember');
var sourcemaps = require('gulp-sourcemaps');
var mocha = require('gulp-mocha');
var gutil = require('gulp-util');
var jsdoc = require('gulp-jsdoc');
var git = require('gulp-git');

var PATH_SOURCE = 'src/main/**';
var PATH_TEST = 'src/test/**';
var PATH_BUILD = 'target/dist';
var PATH_DOCS = 'target/docs';
var NAME_OUTPUT = 'mimic-client.js';
var TASK_BUILD = 'build';
var TASK_TEST = 'test';
var TASK_DOCS = 'docs';

var CONF_MOCHA = {
	reporter: 'spec',
	globals: {
		should: require('should')
	}
};

var CONF_DOCS = {
	folder: PATH_DOCS,
	domain: 'aetheric.co.nz'
};

var CONF_JSDOC = {
	plugins: [
		'plugins/markdown'
	]
};

gulp.task('default', function() {
	//TODO: run build
});

gulp.task(TASK_TEST, function() {
	return gulp
		.src([ PATH_BUILD + '.js' ], { read: false })
		.pipe(mocha(CONF_MOCHA))
		.on('error', gutil.log);
});

gulp.task(TASK_TEST + '-watch', function() {
	return gulp
		.watch([ PATH_LIB, PATH_TEST ], [ TASK_TEST ]);
});

gulp.task(TASK_BUILD, function() {
	return gulp
		.src(PATH_SOURCE)
		.pipe(cached(TASK_BUILD))
		//! add any extra compilation steps here.
		.pipe(remember(TASK_BUILD))
		.pipe(concat(NAME_OUTPUT))
		.pipe(gulp.dest(PATH_BUILD));
});

gulp.task(TASK_BUILD + '-watch', function() {
	var watcher = gulp.watch(PATH_SOURCE + '.js', [ TASK_BUILD ]);
	return watcher.on('change', function(event) {
		if (event.type === 'deleted') {
			delete cached.caches.scripts[event.path];
			remember.forget(TASK_BUILD, event.path);
		}
	});
});

gulp.task(TASK_DOCS, function() {
	return gulp
		.src([ PATH_SOURCE + '.js', 'README.md' ])
		.pipe(jsdoc.parser(CONF_JSDOC))
		.pipe(gulp.dest(PATH_DOCS))
		.pipe(jsdoc.generator(PATH_DOCS));
});

gulp.task(TASK_DOCS + '-watch', function() {
	return gulp
		.watch([ PATH_SOURCE ], [ TASK_DOCS ]);
});

gulp.task('package', function() {
	return gulp
		.src(PATH_BUILD + '/' + NAME_OUTPUT)
		.pipe(sourcemaps.init({ loadmaps: true }))
		//! add any extra transforms here.
		.pipe(uglify())
		.pipe(rename({ extname: '.min.js' }))
		.pipe(gulp.dest(PATH_BUILD));
});

gulp.task('release', function() {

	buildBranch(CONF_DOCS, function(error) {
		if (error) throw error;
		console.log('Documentation published!');
	});

});

