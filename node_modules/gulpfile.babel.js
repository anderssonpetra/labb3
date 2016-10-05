import gulp from 'gulp';
import watch from 'gulp-watch';
import del from 'del';
import concatCss from 'gulp-concat-css';
import autoprefixer from 'gulp-autoprefixer';
import minifyCss from 'gulp-minify-css';
import ts from 'gulp-typescript';
import browserSync from 'browser-sync';
import series from 'stream-series';
import concat from 'gulp-concat';
import inlineNg2Template from 'gulp-inline-ng2-template';

//Reloading server on change.
let reload = browserSync.reload;

//Dependencies for our application (Angular not included).
let jsDependencys = [
    './node_modules/systemjs/dist/system.src.js',
    './node_modules/zone.js/dist/zone.js',
    './node_modules/reflect-metadata/Reflect.js',
    './node_modules/rxjs/bundles/rx.js'
];

//Static files that dont need a build-step, will just be copied to dist folder.
let staticFiles = [
    './src/images/**/*',
    './src/fonts/**/*',
    './src/*.html',
    './src/js/systemjs.config.js',
];

let angularFiles = [
    './node_modules/@angular/**/*.umd.js'
];


//We copy all images, fonts and regular html files to our dist location---------
gulp.task('copy', () => {
    return gulp.src(staticFiles, { base: './src/' })
        .pipe(gulp.dest('dist'))
        .pipe(reload({ stream: true }));
});

//Copy angular modules to dist/js/lib so the system module-loader can find them-
gulp.task('copy-angular', () => {
    return gulp.src(angularFiles).pipe(gulp.dest('./dist/js/lib/@angular/'));
});


//Concat all dependencies into one file and move to dist/js/lib
gulp.task('jsdependencies', () => {
    return series(gulp.src(jsDependencys[0]),
        gulp.src(jsDependencys[1]),
        gulp.src(jsDependencys[2]),
        gulp.src(jsDependencys[3]))
        .pipe(concat('app.dependencies.js'))
        .pipe(gulp.dest('./dist/js/lib'))
        .pipe(reload({ stream: true }));
});

//Turn all .ts files into .js (ecma5) and move to dist/js/app------------------
let tsProject = ts.createProject({
    target: "es5",
    module: "system",
    moduleResolution: "node",
    noExternalResolve: true,
    sourceMap: false,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    removeComments: false,
    noImplicitAny: false,
    exclude: ['node_modules']
});

gulp.task('ts', [], () => {
    return gulp.src(['./src/js/app/**/*.ts'])
        .pipe(inlineNg2Template({ base: '/src/', removeLineBreaks: true }))
        .pipe(ts(tsProject))
        .pipe(gulp.dest('dist/js/app'))
        .pipe(reload({ stream: true }));
});

//Prefix and minify all css, move to dist but keep all files separate----------
gulp.task('css', function () {
    return gulp.src(['./src/css/*.css'], { base: './src/' })
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(minifyCss())
        .pipe(gulp.dest('dist'))
        .pipe(reload({ stream: true }));
});


//Watch all files and invoke task if change detected, then tell browser-sync to reload.
gulp.task('watch', ['ts', 'css', 'copy', 'copy-angular', 'jsdependencies'], () => {
    watch(staticFiles, () => {
            gulp.start('copy');
        });

    watch(['./src/css/*.css'], () => {
        gulp.start('css');
    });

    watch(['./src/js/app/**/*.*'], () => {
        gulp.start('ts');
    });

    browserSync.init({
        injectChanges: true,
        notify: true,
        server: {
            baseDir: "./dist"
        }

    });
});

//Clean (delete) dist folder
gulp.task('clean', () => {
    return del('dist');
});

//Default task = watch
gulp.task('default', ['watch']);