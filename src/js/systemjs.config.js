(function(global) {

  // map tells the System loader where to look for things
  var map = {
    'app':                        'js/app', // 'dist',
    '@angular':                   'js/lib/@angular'
  };

  // packages tells the System loader how to load when no filename and/or no extension
  var packages = {
    'app':                        { main: 'boot.js',  defaultExtension: 'js' },
  };

  var packageNames = [
    'common',
    'compiler',
    'core',
    'http',
    'platform-browser',
    'platform-browser-dynamic',
    'router',
    'router-deprecated',
    'testing',
    'upgrade',
  ];

  // add package entries for angular packages in the form '@angular/common': { main: 'X.umd.js', defaultExtension: 'js' }
  packageNames.forEach(function(pkgName) {
    packages['@angular/' + pkgName] = { main: pkgName + '.umd.js', defaultExtension: 'js' };
  });

  var config = {
    map: map,
    packages: packages
  }

  // filterSystemConfig - index.html's chance to modify config before we register it.
  if (global.filterSystemConfig) { global.filterSystemConfig(config); }

  System.config(config);

})(this);