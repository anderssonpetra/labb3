/*
 * SystemJS v0.19.27
 */
(function() {
function bootstrap() {// from https://gist.github.com/Yaffle/1088850
(function(global) {
function URLPolyfill(url, baseURL) {
  if (typeof url != 'string')
    throw new TypeError('URL must be a string');
  var m = String(url).replace(/^\s+|\s+$/g, "").match(/^([^:\/?#]+:)?(?:\/\/(?:([^:@\/?#]*)(?::([^:@\/?#]*))?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
  if (!m)
    throw new RangeError('Invalid URL format');
  var protocol = m[1] || "";
  var username = m[2] || "";
  var password = m[3] || "";
  var host = m[4] || "";
  var hostname = m[5] || "";
  var port = m[6] || "";
  var pathname = m[7] || "";
  var search = m[8] || "";
  var hash = m[9] || "";
  if (baseURL !== undefined) {
    var base = baseURL instanceof URLPolyfill ? baseURL : new URLPolyfill(baseURL);
    var flag = !protocol && !host && !username;
    if (flag && !pathname && !search)
      search = base.search;
    if (flag && pathname[0] !== "/")
      pathname = (pathname ? (((base.host || base.username) && !base.pathname ? "/" : "") + base.pathname.slice(0, base.pathname.lastIndexOf("/") + 1) + pathname) : base.pathname);
    // dot segments removal
    var output = [];
    pathname.replace(/^(\.\.?(\/|$))+/, "")
      .replace(/\/(\.(\/|$))+/g, "/")
      .replace(/\/\.\.$/, "/../")
      .replace(/\/?[^\/]*/g, function (p) {
        if (p === "/..")
          output.pop();
        else
          output.push(p);
      });
    pathname = output.join("").replace(/^\//, pathname[0] === "/" ? "/" : "");
    if (flag) {
      port = base.port;
      hostname = base.hostname;
      host = base.host;
      password = base.password;
      username = base.username;
    }
    if (!protocol)
      protocol = base.protocol;
  }

  // convert windows file URLs to use /
  if (protocol == 'file:')
    pathname = pathname.replace(/\\/g, '/');

  this.origin = host ? protocol + (protocol !== "" || host !== "" ? "//" : "") + host : "";
  this.href = protocol + (protocol && host || protocol == "file:" ? "//" : "") + (username !== "" ? username + (password !== "" ? ":" + password : "") + "@" : "") + host + pathname + search + hash;
  this.protocol = protocol;
  this.username = username;
  this.password = password;
  this.host = host;
  this.hostname = hostname;
  this.port = port;
  this.pathname = pathname;
  this.search = search;
  this.hash = hash;
}
global.URLPolyfill = URLPolyfill;
})(typeof self != 'undefined' ? self : global);(function(__global) {

  var isWorker = typeof window == 'undefined' && typeof self != 'undefined' && typeof importScripts != 'undefined';
  var isBrowser = typeof window != 'undefined' && typeof document != 'undefined';
  var isWindows = typeof process != 'undefined' && typeof process.platform != 'undefined' && !!process.platform.match(/^win/);

  if (!__global.console)
    __global.console = { assert: function() {} };

  // IE8 support
  var indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, thisLen = this.length; i < thisLen; i++) {
      if (this[i] === item) {
        return i;
      }
    }
    return -1;
  };
  
  var defineProperty;
  (function () {
    try {
      if (!!Object.defineProperty({}, 'a', {}))
        defineProperty = Object.defineProperty;
    }
    catch (e) {
      defineProperty = function(obj, prop, opt) {
        try {
          obj[prop] = opt.value || opt.get.call(obj);
        }
        catch(e) {}
      }
    }
  })();

  var errArgs = new Error(0, '_').fileName == '_';

  function addToError(err, msg) {
    // parse the stack removing loader code lines for simplification
    if (!err.originalErr) {
      var stack = (err.stack || err.message || err).split('\n');
      var newStack = [];
      for (var i = 0; i < stack.length; i++) {
        if (typeof $__curScript == 'undefined' || stack[i].indexOf($__curScript.src) == -1)
          newStack.push(stack[i]);
      }
    }

    var newMsg = (newStack ? newStack.join('\n\t') : err.message) + '\n\t' + msg;

    // Convert file:/// URLs to paths in Node
    if (!isBrowser)
      newMsg = newMsg.replace(isWindows ? /file:\/\/\//g : /file:\/\//g, '');

    var newErr = errArgs ? new Error(newMsg, err.fileName, err.lineNumber) : new Error(newMsg);
    
    // Node needs stack adjustment for throw to show message
    if (!isBrowser)
      newErr.stack = newMsg;
    // Clearing the stack stops unnecessary loader lines showing
    else
      newErr.stack = null;
    
    // track the original error
    newErr.originalErr = err.originalErr || err;

    return newErr;
  }

  function __eval(source, debugName, context) {
    try {
      new Function(source).call(context);
    }
    catch(e) {
      throw addToError(e, 'Evaluating ' + debugName);
    }
  }

  var baseURI;
  // environent baseURI detection
  if (typeof document != 'undefined' && document.getElementsByTagName) {
    baseURI = document.baseURI;

    if (!baseURI) {
      var bases = document.getElementsByTagName('base');
      baseURI = bases[0] && bases[0].href || window.location.href;
    }

    // sanitize out the hash and querystring
    baseURI = baseURI.split('#')[0].split('?')[0];
    baseURI = baseURI.substr(0, baseURI.lastIndexOf('/') + 1);
  }
  else if (typeof process != 'undefined' && process.cwd) {
    baseURI = 'file://' + (isWindows ? '/' : '') + process.cwd() + '/';
    if (isWindows)
      baseURI = baseURI.replace(/\\/g, '/');
  }
  else if (typeof location != 'undefined') {
    baseURI = __global.location.href;
  }
  else {
    throw new TypeError('No environment baseURI');
  }

  try {
    var nativeURL = new __global.URL('test:///').protocol == 'test:';
  }
  catch(e) {}

  var URL = nativeURL ? __global.URL : __global.URLPolyfill;
/*
*********************************************************************************************

  Dynamic Module Loader Polyfill

    - Implemented exactly to the former 2014-08-24 ES6 Specification Draft Rev 27, Section 15
      http://wiki.ecmascript.org/doku.php?id=harmony:specification_drafts#august_24_2014_draft_rev_27

    - Functions are commented with their spec numbers, with spec differences commented.

    - Spec bugs are commented in this code with links.

    - Abstract functions have been combined where possible, and their associated functions
      commented.

    - Realm implementation is entirely omitted.

*********************************************************************************************
*/

function Module() {}
// http://www.ecma-international.org/ecma-262/6.0/#sec-@@tostringtag
defineProperty(Module.prototype, 'toString', {
  value: function() {
    return 'Module';
  }
});
function Loader(options) {
  this._loader = {
    loaderObj: this,
    loads: [],
    modules: {},
    importPromises: {},
    moduleRecords: {}
  };

  // 26.3.3.6
  defineProperty(this, 'global', {
    get: function() {
      return __global;
    }
  });

  // 26.3.3.13 realm not implemented
}

(function() {

// Some Helpers

// logs a linkset snapshot for debugging
/* function snapshot(loader) {
  console.log('---Snapshot---');
  for (var i = 0; i < loader.loads.length; i++) {
    var load = loader.loads[i];
    var linkSetLog = '  ' + load.name + ' (' + load.status + '): ';

    for (var j = 0; j < load.linkSets.length; j++) {
      linkSetLog += '{' + logloads(load.linkSets[j].loads) + '} ';
    }
    console.log(linkSetLog);
  }
  console.log('');
}
function logloads(loads) {
  var log = '';
  for (var k = 0; k < loads.length; k++)
    log += loads[k].name + (k != loads.length - 1 ? ' ' : '');
  return log;
} */


/* function checkInvariants() {
  // see https://bugs.ecmascript.org/show_bug.cgi?id=2603#c1

  var loads = System._loader.loads;
  var linkSets = [];

  for (var i = 0; i < loads.length; i++) {
    var load = loads[i];
    console.assert(load.status == 'loading' || load.status == 'loaded', 'Each load is loading or loaded');

    for (var j = 0; j < load.linkSets.length; j++) {
      var linkSet = load.linkSets[j];

      for (var k = 0; k < linkSet.loads.length; k++)
        console.assert(loads.indexOf(linkSet.loads[k]) != -1, 'linkSet loads are a subset of loader loads');

      if (linkSets.indexOf(linkSet) == -1)
        linkSets.push(linkSet);
    }
  }

  for (var i = 0; i < loads.length; i++) {
    var load = loads[i];
    for (var j = 0; j < linkSets.length; j++) {
      var linkSet = linkSets[j];

      if (linkSet.loads.indexOf(load) != -1)
        console.assert(load.linkSets.indexOf(linkSet) != -1, 'linkSet contains load -> load contains linkSet');

      if (load.linkSets.indexOf(linkSet) != -1)
        console.assert(linkSet.loads.indexOf(load) != -1, 'load contains linkSet -> linkSet contains load');
    }
  }

  for (var i = 0; i < linkSets.length; i++) {
    var linkSet = linkSets[i];
    for (var j = 0; j < linkSet.loads.length; j++) {
      var load = linkSet.loads[j];

      for (var k = 0; k < load.dependencies.length; k++) {
        var depName = load.dependencies[k].value;
        var depLoad;
        for (var l = 0; l < loads.length; l++) {
          if (loads[l].name != depName)
            continue;
          depLoad = loads[l];
          break;
        }

        // loading records are allowed not to have their dependencies yet
        // if (load.status != 'loading')
        //  console.assert(depLoad, 'depLoad found');

        // console.assert(linkSet.loads.indexOf(depLoad) != -1, 'linkset contains all dependencies');
      }
    }
  }
} */

  // 15.2.3 - Runtime Semantics: Loader State

  // 15.2.3.11
  function createLoaderLoad(object) {
    return {
      // modules is an object for ES5 implementation
      modules: {},
      loads: [],
      loaderObj: object
    };
  }

  // 15.2.3.2 Load Records and LoadRequest Objects

  // 15.2.3.2.1
  function createLoad(name) {
    return {
      status: 'loading',
      name: name,
      linkSets: [],
      dependencies: [],
      metadata: {}
    };
  }

  // 15.2.3.2.2 createLoadRequestObject, absorbed into calling functions

  // 15.2.4

  // 15.2.4.1
  function loadModule(loader, name, options) {
    return new Promise(asyncStartLoadPartwayThrough({
      step: options.address ? 'fetch' : 'locate',
      loader: loader,
      moduleName: name,
      // allow metadata for import https://bugs.ecmascript.org/show_bug.cgi?id=3091
      moduleMetadata: options && options.metadata || {},
      moduleSource: options.source,
      moduleAddress: options.address
    }));
  }

  // 15.2.4.2
  function requestLoad(loader, request, refererName, refererAddress) {
    // 15.2.4.2.1 CallNormalize
    return new Promise(function(resolve, reject) {
      resolve(loader.loaderObj.normalize(request, refererName, refererAddress));
    })
    // 15.2.4.2.2 GetOrCreateLoad
    .then(function(name) {
      var load;
      if (loader.modules[name]) {
        load = createLoad(name);
        load.status = 'linked';
        // https://bugs.ecmascript.org/show_bug.cgi?id=2795
        load.module = loader.modules[name];
        return load;
      }

      for (var i = 0, l = loader.loads.length; i < l; i++) {
        load = loader.loads[i];
        if (load.name != name)
          continue;
        console.assert(load.status == 'loading' || load.status == 'loaded', 'loading or loaded');
        return load;
      }

      load = createLoad(name);
      loader.loads.push(load);

      proceedToLocate(loader, load);

      return load;
    });
  }

  // 15.2.4.3
  function proceedToLocate(loader, load) {
    proceedToFetch(loader, load,
      Promise.resolve()
      // 15.2.4.3.1 CallLocate
      .then(function() {
        return loader.loaderObj.locate({ name: load.name, metadata: load.metadata });
      })
    );
  }

  // 15.2.4.4
  function proceedToFetch(loader, load, p) {
    proceedToTranslate(loader, load,
      p
      // 15.2.4.4.1 CallFetch
      .then(function(address) {
        // adjusted, see https://bugs.ecmascript.org/show_bug.cgi?id=2602
        if (load.status != 'loading')
          return;
        load.address = address;

        return loader.loaderObj.fetch({ name: load.name, metadata: load.metadata, address: address });
      })
    );
  }

  var anonCnt = 0;

  // 15.2.4.5
  function proceedToTranslate(loader, load, p) {
    p
    // 15.2.4.5.1 CallTranslate
    .then(function(source) {
      if (load.status != 'loading')
        return;

      return Promise.resolve(loader.loaderObj.translate({ name: load.name, metadata: load.metadata, address: load.address, source: source }))

      // 15.2.4.5.2 CallInstantiate
      .then(function(source) {
        load.source = source;
        return loader.loaderObj.instantiate({ name: load.name, metadata: load.metadata, address: load.address, source: source });
      })

      // 15.2.4.5.3 InstantiateSucceeded
      .then(function(instantiateResult) {
        if (instantiateResult === undefined) {
          load.address = load.address || '<Anonymous Module ' + ++anonCnt + '>';

          // instead of load.kind, use load.isDeclarative
          load.isDeclarative = true;
          return transpile.call(loader.loaderObj, load)
          .then(function(transpiled) {
            // Hijack System.register to set declare function
            var curSystem = __global.System;
            var curRegister = curSystem.register;
            curSystem.register = function(name, deps, declare) {
              if (typeof name != 'string') {
                declare = deps;
                deps = name;
              }
              // store the registered declaration as load.declare
              // store the deps as load.deps
              load.declare = declare;
              load.depsList = deps;
            }
            // empty {} context is closest to undefined 'this' we can get
            __eval(transpiled, load.address, {});
            curSystem.register = curRegister;
          });
        }
        else if (typeof instantiateResult == 'object') {
          load.depsList = instantiateResult.deps || [];
          load.execute = instantiateResult.execute;
          load.isDeclarative = false;
        }
        else
          throw TypeError('Invalid instantiate return value');
      })
      // 15.2.4.6 ProcessLoadDependencies
      .then(function() {
        load.dependencies = [];
        var depsList = load.depsList;

        var loadPromises = [];
        for (var i = 0, l = depsList.length; i < l; i++) (function(request, index) {
          loadPromises.push(
            requestLoad(loader, request, load.name, load.address)

            // 15.2.4.6.1 AddDependencyLoad (load is parentLoad)
            .then(function(depLoad) {

              // adjusted from spec to maintain dependency order
              // this is due to the System.register internal implementation needs
              load.dependencies[index] = {
                key: request,
                value: depLoad.name
              };

              if (depLoad.status != 'linked') {
                var linkSets = load.linkSets.concat([]);
                for (var i = 0, l = linkSets.length; i < l; i++)
                  addLoadToLinkSet(linkSets[i], depLoad);
              }

              // console.log('AddDependencyLoad ' + depLoad.name + ' for ' + load.name);
              // snapshot(loader);
            })
          );
        })(depsList[i], i);

        return Promise.all(loadPromises);
      })

      // 15.2.4.6.2 LoadSucceeded
      .then(function() {
        // console.log('LoadSucceeded ' + load.name);
        // snapshot(loader);

        console.assert(load.status == 'loading', 'is loading');

        load.status = 'loaded';

        var linkSets = load.linkSets.concat([]);
        for (var i = 0, l = linkSets.length; i < l; i++)
          updateLinkSetOnLoad(linkSets[i], load);
      });
    })
    // 15.2.4.5.4 LoadFailed
    ['catch'](function(exc) {
      load.status = 'failed';
      load.exception = exc;

      var linkSets = load.linkSets.concat([]);
      for (var i = 0, l = linkSets.length; i < l; i++) {
        linkSetFailed(linkSets[i], load, exc);
      }

      console.assert(load.linkSets.length == 0, 'linkSets not removed');
    });
  }

  // 15.2.4.7 PromiseOfStartLoadPartwayThrough absorbed into calling functions

  // 15.2.4.7.1
  function asyncStartLoadPartwayThrough(stepState) {
    return function(resolve, reject) {
      var loader = stepState.loader;
      var name = stepState.moduleName;
      var step = stepState.step;

      if (loader.modules[name])
        throw new TypeError('"' + name + '" already exists in the module table');

      // adjusted to pick up existing loads
      var existingLoad;
      for (var i = 0, l = loader.loads.length; i < l; i++) {
        if (loader.loads[i].name == name) {
          existingLoad = loader.loads[i];

          if (step == 'translate' && !existingLoad.source) {
            existingLoad.address = stepState.moduleAddress;
            proceedToTranslate(loader, existingLoad, Promise.resolve(stepState.moduleSource));
          }

          // a primary load -> use that existing linkset if it is for the direct load here
          // otherwise create a new linkset unit
          if (existingLoad.linkSets.length && existingLoad.linkSets[0].loads[0].name == existingLoad.name)
            return existingLoad.linkSets[0].done.then(function() {
              resolve(existingLoad);
            });
        }
      }

      var load = existingLoad || createLoad(name);

      load.metadata = stepState.moduleMetadata;

      var linkSet = createLinkSet(loader, load);

      loader.loads.push(load);

      resolve(linkSet.done);

      if (step == 'locate')
        proceedToLocate(loader, load);

      else if (step == 'fetch')
        proceedToFetch(loader, load, Promise.resolve(stepState.moduleAddress));

      else {
        console.assert(step == 'translate', 'translate step');
        load.address = stepState.moduleAddress;
        proceedToTranslate(loader, load, Promise.resolve(stepState.moduleSource));
      }
    }
  }

  // Declarative linking functions run through alternative implementation:
  // 15.2.5.1.1 CreateModuleLinkageRecord not implemented
  // 15.2.5.1.2 LookupExport not implemented
  // 15.2.5.1.3 LookupModuleDependency not implemented

  // 15.2.5.2.1
  function createLinkSet(loader, startingLoad) {
    var linkSet = {
      loader: loader,
      loads: [],
      startingLoad: startingLoad, // added see spec bug https://bugs.ecmascript.org/show_bug.cgi?id=2995
      loadingCount: 0
    };
    linkSet.done = new Promise(function(resolve, reject) {
      linkSet.resolve = resolve;
      linkSet.reject = reject;
    });
    addLoadToLinkSet(linkSet, startingLoad);
    return linkSet;
  }
  // 15.2.5.2.2
  function addLoadToLinkSet(linkSet, load) {
    if (load.status == 'failed')
      return;

    console.assert(load.status == 'loading' || load.status == 'loaded', 'loading or loaded on link set');

    for (var i = 0, l = linkSet.loads.length; i < l; i++)
      if (linkSet.loads[i] == load)
        return;

    linkSet.loads.push(load);
    load.linkSets.push(linkSet);

    // adjustment, see https://bugs.ecmascript.org/show_bug.cgi?id=2603
    if (load.status != 'loaded') {
      linkSet.loadingCount++;
    }

    var loader = linkSet.loader;

    for (var i = 0, l = load.dependencies.length; i < l; i++) {
      if (!load.dependencies[i])
        continue;

      var name = load.dependencies[i].value;

      if (loader.modules[name])
        continue;

      for (var j = 0, d = loader.loads.length; j < d; j++) {
        if (loader.loads[j].name != name)
          continue;

        addLoadToLinkSet(linkSet, loader.loads[j]);
        break;
      }
    }
    // console.log('add to linkset ' + load.name);
    // snapshot(linkSet.loader);
  }

  // linking errors can be generic or load-specific
  // this is necessary for debugging info
  function doLink(linkSet) {
    var error = false;
    try {
      link(linkSet, function(load, exc) {
        linkSetFailed(linkSet, load, exc);
        error = true;
      });
    }
    catch(e) {
      linkSetFailed(linkSet, null, e);
      error = true;
    }
    return error;
  }

  // 15.2.5.2.3
  function updateLinkSetOnLoad(linkSet, load) {
    // console.log('update linkset on load ' + load.name);
    // snapshot(linkSet.loader);

    console.assert(load.status == 'loaded' || load.status == 'linked', 'loaded or linked');

    linkSet.loadingCount--;

    if (linkSet.loadingCount > 0)
      return;

    // adjusted for spec bug https://bugs.ecmascript.org/show_bug.cgi?id=2995
    var startingLoad = linkSet.startingLoad;

    // non-executing link variation for loader tracing
    // on the server. Not in spec.
    /***/
    if (linkSet.loader.loaderObj.execute === false) {
      var loads = [].concat(linkSet.loads);
      for (var i = 0, l = loads.length; i < l; i++) {
        var load = loads[i];
        load.module = !load.isDeclarative ? {
          module: _newModule({})
        } : {
          name: load.name,
          module: _newModule({}),
          evaluated: true
        };
        load.status = 'linked';
        finishLoad(linkSet.loader, load);
      }
      return linkSet.resolve(startingLoad);
    }
    /***/

    var abrupt = doLink(linkSet);

    if (abrupt)
      return;

    console.assert(linkSet.loads.length == 0, 'loads cleared');

    linkSet.resolve(startingLoad);
  }

  // 15.2.5.2.4
  function linkSetFailed(linkSet, load, exc) {
    var loader = linkSet.loader;
    var requests;

    checkError: 
    if (load) {
      if (linkSet.loads[0].name == load.name) {
        exc = addToError(exc, 'Error loading ' + load.name);
      }
      else {
        for (var i = 0; i < linkSet.loads.length; i++) {
          var pLoad = linkSet.loads[i];
          for (var j = 0; j < pLoad.dependencies.length; j++) {
            var dep = pLoad.dependencies[j];
            if (dep.value == load.name) {
              exc = addToError(exc, 'Error loading ' + load.name + ' as "' + dep.key + '" from ' + pLoad.name);
              break checkError;
            }
          }
        }
        exc = addToError(exc, 'Error loading ' + load.name + ' from ' + linkSet.loads[0].name);
      }
    }
    else {
      exc = addToError(exc, 'Error linking ' + linkSet.loads[0].name);
    }


    var loads = linkSet.loads.concat([]);
    for (var i = 0, l = loads.length; i < l; i++) {
      var load = loads[i];

      // store all failed load records
      loader.loaderObj.failed = loader.loaderObj.failed || [];
      if (indexOf.call(loader.loaderObj.failed, load) == -1)
        loader.loaderObj.failed.push(load);

      var linkIndex = indexOf.call(load.linkSets, linkSet);
      console.assert(linkIndex != -1, 'link not present');
      load.linkSets.splice(linkIndex, 1);
      if (load.linkSets.length == 0) {
        var globalLoadsIndex = indexOf.call(linkSet.loader.loads, load);
        if (globalLoadsIndex != -1)
          linkSet.loader.loads.splice(globalLoadsIndex, 1);
      }
    }
    linkSet.reject(exc);
  }

  // 15.2.5.2.5
  function finishLoad(loader, load) {
    // add to global trace if tracing
    if (loader.loaderObj.trace) {
      if (!loader.loaderObj.loads)
        loader.loaderObj.loads = {};
      var depMap = {};
      load.dependencies.forEach(function(dep) {
        depMap[dep.key] = dep.value;
      });
      loader.loaderObj.loads[load.name] = {
        name: load.name,
        deps: load.dependencies.map(function(dep){ return dep.key }),
        depMap: depMap,
        address: load.address,
        metadata: load.metadata,
        source: load.source,
        kind: load.isDeclarative ? 'declarative' : 'dynamic'
      };
    }
    // if not anonymous, add to the module table
    if (load.name) {
      console.assert(!loader.modules[load.name], 'load not in module table');
      loader.modules[load.name] = load.module;
    }
    var loadIndex = indexOf.call(loader.loads, load);
    if (loadIndex != -1)
      loader.loads.splice(loadIndex, 1);
    for (var i = 0, l = load.linkSets.length; i < l; i++) {
      loadIndex = indexOf.call(load.linkSets[i].loads, load);
      if (loadIndex != -1)
        load.linkSets[i].loads.splice(loadIndex, 1);
    }
    load.linkSets.splice(0, load.linkSets.length);
  }

  function doDynamicExecute(linkSet, load, linkError) {
    try {
      var module = load.execute();
    }
    catch(e) {
      linkError(load, e);
      return;
    }
    if (!module || !(module instanceof Module))
      linkError(load, new TypeError('Execution must define a Module instance'));
    else
      return module;
  }

  // 26.3 Loader

  // 26.3.1.1
  // defined at top

  // importPromises adds ability to import a module twice without error - https://bugs.ecmascript.org/show_bug.cgi?id=2601
  function createImportPromise(loader, name, promise) {
    var importPromises = loader._loader.importPromises;
    return importPromises[name] = promise.then(function(m) {
      importPromises[name] = undefined;
      return m;
    }, function(e) {
      importPromises[name] = undefined;
      throw e;
    });
  }

  Loader.prototype = {
    // 26.3.3.1
    constructor: Loader,
    // 26.3.3.2
    define: function(name, source, options) {
      // check if already defined
      if (this._loader.importPromises[name])
        throw new TypeError('Module is already loading.');
      return createImportPromise(this, name, new Promise(asyncStartLoadPartwayThrough({
        step: 'translate',
        loader: this._loader,
        moduleName: name,
        moduleMetadata: options && options.metadata || {},
        moduleSource: source,
        moduleAddress: options && options.address
      })));
    },
    // 26.3.3.3
    'delete': function(name) {
      var loader = this._loader;
      delete loader.importPromises[name];
      delete loader.moduleRecords[name];
      return loader.modules[name] ? delete loader.modules[name] : false;
    },
    // 26.3.3.4 entries not implemented
    // 26.3.3.5
    get: function(key) {
      if (!this._loader.modules[key])
        return;
      doEnsureEvaluated(this._loader.modules[key], [], this);
      return this._loader.modules[key].module;
    },
    // 26.3.3.7
    has: function(name) {
      return !!this._loader.modules[name];
    },
    // 26.3.3.8
    'import': function(name, parentName, parentAddress) {
      if (typeof parentName == 'object')
        parentName = parentName.name;

      // run normalize first
      var loaderObj = this;

      // added, see https://bugs.ecmascript.org/show_bug.cgi?id=2659
      return Promise.resolve(loaderObj.normalize(name, parentName))
      .then(function(name) {
        var loader = loaderObj._loader;

        if (loader.modules[name]) {
          doEnsureEvaluated(loader.modules[name], [], loader._loader);
          return loader.modules[name].module;
        }

        return loader.importPromises[name] || createImportPromise(loaderObj, name,
          loadModule(loader, name, {})
          .then(function(load) {
            delete loader.importPromises[name];
            return evaluateLoadedModule(loader, load);
          }));
      });
    },
    // 26.3.3.9 keys not implemented
    // 26.3.3.10
    load: function(name) {
      var loader = this._loader;
      if (loader.modules[name])
        return Promise.resolve();
      return loader.importPromises[name] || createImportPromise(this, name, new Promise(asyncStartLoadPartwayThrough({
        step: 'locate',
        loader: loader,
        moduleName: name,
        moduleMetadata: {},
        moduleSource: undefined,
        moduleAddress: undefined
      }))
      .then(function() {
        delete loader.importPromises[name];
      }));
    },
    // 26.3.3.11
    module: function(source, options) {
      var load = createLoad();
      load.address = options && options.address;
      var linkSet = createLinkSet(this._loader, load);
      var sourcePromise = Promise.resolve(source);
      var loader = this._loader;
      var p = linkSet.done.then(function() {
        return evaluateLoadedModule(loader, load);
      });
      proceedToTranslate(loader, load, sourcePromise);
      return p;
    },
    // 26.3.3.12
    newModule: function (obj) {
      if (typeof obj != 'object')
        throw new TypeError('Expected object');

      var m = new Module();

      var pNames = [];
      if (Object.getOwnPropertyNames && obj != null)
        pNames = Object.getOwnPropertyNames(obj);
      else
        for (var key in obj)
          pNames.push(key);

      for (var i = 0; i < pNames.length; i++) (function(key) {
        defineProperty(m, key, {
          configurable: false,
          enumerable: true,
          get: function () {
            return obj[key];
          },
          set: function() {
            throw new Error('Module exports cannot be changed externally.');
          }
        });
      })(pNames[i]);

      if (Object.freeze)
        Object.freeze(m);

      return m;
    },
    // 26.3.3.14
    set: function(name, module) {
      if (!(module instanceof Module))
        throw new TypeError('Loader.set(' + name + ', module) must be a module');
      this._loader.modules[name] = {
        module: module
      };
    },
    // 26.3.3.15 values not implemented
    // 26.3.3.16 @@iterator not implemented
    // 26.3.3.17 @@toStringTag not implemented

    // 26.3.3.18.1
    normalize: function(name, referrerName, referrerAddress) {
      return name;
    },
    // 26.3.3.18.2
    locate: function(load) {
      return load.name;
    },
    // 26.3.3.18.3
    fetch: function(load) {
    },
    // 26.3.3.18.4
    translate: function(load) {
      return load.source;
    },
    // 26.3.3.18.5
    instantiate: function(load) {
    }
  };

  var _newModule = Loader.prototype.newModule;
/*
 * ES6 Module Declarative Linking Code - Dev Build Only
 */
  function link(linkSet, linkError) {

    var loader = linkSet.loader;

    if (!linkSet.loads.length)
      return;

    var loads = linkSet.loads.concat([]);

    for (var i = 0; i < loads.length; i++) {
      var load = loads[i];

      var module = doDynamicExecute(linkSet, load, linkError);
      if (!module)
        return;
      load.module = {
        name: load.name,
        module: module
      };
      load.status = 'linked';

      finishLoad(loader, load);
    }
  }

  function evaluateLoadedModule(loader, load) {
    console.assert(load.status == 'linked', 'is linked ' + load.name);
    return load.module.module;
  }

  function doEnsureEvaluated() {}

  function transpile() {
    throw new TypeError('ES6 transpilation is only provided in the dev module loader build.');
  }
})();/*
*********************************************************************************************

  System Loader Implementation

    - Implemented to https://github.com/jorendorff/js-loaders/blob/master/browser-loader.js

    - <script type="module"> supported

*********************************************************************************************
*/

var System;

function SystemLoader() {
  Loader.call(this);
  this.paths = {};
}

// NB no specification provided for System.paths, used ideas discussed in https://github.com/jorendorff/js-loaders/issues/25
function applyPaths(paths, name) {
  // most specific (most number of slashes in path) match wins
  var pathMatch = '', wildcard, maxWildcardPrefixLen = 0;

  // check to see if we have a paths entry
  for (var p in paths) {
    var pathParts = p.split('*');
    if (pathParts.length > 2)
      throw new TypeError('Only one wildcard in a path is permitted');

    // exact path match
    if (pathParts.length == 1) {
      if (name == p)
        return paths[p];
      
      // support trailing / in paths rules
      else if (name.substr(0, p.length - 1) == p.substr(0, p.length - 1) && (name.length < p.length || name[p.length - 1] == p[p.length - 1]) && paths[p][paths[p].length - 1] == '/')
        return paths[p].substr(0, paths[p].length - 1) + (name.length > p.length ? '/' + name.substr(p.length) : '');
    }
    // wildcard path match
    else {
      var wildcardPrefixLen = pathParts[0].length;
      if (wildcardPrefixLen >= maxWildcardPrefixLen &&
          name.substr(0, pathParts[0].length) == pathParts[0] &&
          name.substr(name.length - pathParts[1].length) == pathParts[1]) {
            maxWildcardPrefixLen = wildcardPrefixLen;
            pathMatch = p;
            wildcard = name.substr(pathParts[0].length, name.length - pathParts[1].length - pathParts[0].length);
          }
    }
  }

  var outPath = paths[pathMatch];
  if (typeof wildcard == 'string')
    outPath = outPath.replace('*', wildcard);

  return outPath;
}

// inline Object.create-style class extension
function LoaderProto() {}
LoaderProto.prototype = Loader.prototype;
SystemLoader.prototype = new LoaderProto();
  var fetchTextFromURL;
  if (typeof XMLHttpRequest != 'undefined') {
    fetchTextFromURL = function(url, authorization, fulfill, reject) {
      var xhr = new XMLHttpRequest();
      var sameDomain = true;
      var doTimeout = false;
      if (!('withCredentials' in xhr)) {
        // check if same domain
        var domainCheck = /^(\w+:)?\/\/([^\/]+)/.exec(url);
        if (domainCheck) {
          sameDomain = domainCheck[2] === window.location.host;
          if (domainCheck[1])
            sameDomain &= domainCheck[1] === window.location.protocol;
        }
      }
      if (!sameDomain && typeof XDomainRequest != 'undefined') {
        xhr = new XDomainRequest();
        xhr.onload = load;
        xhr.onerror = error;
        xhr.ontimeout = error;
        xhr.onprogress = function() {};
        xhr.timeout = 0;
        doTimeout = true;
      }
      function load() {
        fulfill(xhr.responseText);
      }
      function error() {
        reject(new Error('XHR error' + (xhr.status ? ' (' + xhr.status + (xhr.statusText ? ' ' + xhr.statusText  : '') + ')' : '') + ' loading ' + url));
      }

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          // in Chrome on file:/// URLs, status is 0
          if (xhr.status == 0) {
            if (xhr.responseText) {
              load();
            }
            else {
              // when responseText is empty, wait for load or error event
              // to inform if it is a 404 or empty file
              xhr.addEventListener('error', error);
              xhr.addEventListener('load', load);
            }
          }
          else if (xhr.status === 200) {
            load();
          }
          else {
            error();
          }
        }
      };
      xhr.open("GET", url, true);

      if (xhr.setRequestHeader) {
        xhr.setRequestHeader('Accept', 'application/x-es-module, */*');
        // can set "authorization: true" to enable withCredentials only
        if (authorization) {
          if (typeof authorization == 'string')
            xhr.setRequestHeader('Authorization', authorization);
          xhr.withCredentials = true;
        }
      }

      if (doTimeout) {
        setTimeout(function() {
          xhr.send();
        }, 0);
      } else {
        xhr.send(null);
      }
    };
  }
  else if (typeof require != 'undefined' && typeof process != 'undefined') {
    var fs;
    fetchTextFromURL = function(url, authorization, fulfill, reject) {
      if (url.substr(0, 8) != 'file:///')
        throw new Error('Unable to fetch "' + url + '". Only file URLs of the form file:/// allowed running in Node.');
      fs = fs || require('fs');
      if (isWindows)
        url = url.replace(/\//g, '\\').substr(8);
      else
        url = url.substr(7);
      return fs.readFile(url, function(err, data) {
        if (err) {
          return reject(err);
        }
        else {
          // Strip Byte Order Mark out if it's the leading char
          var dataString = data + '';
          if (dataString[0] === '\ufeff')
            dataString = dataString.substr(1);

          fulfill(dataString);
        }
      });
    };
  }
  else if (typeof self != 'undefined' && typeof self.fetch != 'undefined') {
    fetchTextFromURL = function(url, authorization, fulfill, reject) {
      var opts = {
        headers: {'Accept': 'application/x-es-module, */*'}
      };

      if (authorization) {
        if (typeof authorization == 'string')
          opts.headers['Authorization'] = authorization;
        opts.credentials = 'include';
      }

      fetch(url, opts)
        .then(function (r) {
          if (r.ok) {
            return r.text();
          } else {
            throw new Error('Fetch error: ' + r.status + ' ' + r.statusText);
          }
        })
        .then(fulfill, reject);
    }
  }
  else {
    throw new TypeError('No environment fetch API available.');
  }

  SystemLoader.prototype.fetch = function(load) {
    return new Promise(function(resolve, reject) {
      fetchTextFromURL(load.address, undefined, resolve, reject);
    });
  };
/*
 * Traceur, Babel and TypeScript transpile hook for Loader
 */
var transpile = (function() {

  // use Traceur by default
  Loader.prototype.transpiler = 'traceur';

  function transpile(load) {
    var self = this;

    return Promise.resolve(__global[self.transpiler == 'typescript' ? 'ts' : self.transpiler]
        || (self.pluginLoader || self)['import'](self.transpiler))
    .then(function(transpiler) {
      if (transpiler.__useDefault)
        transpiler = transpiler['default'];

      var transpileFunction;
      if (transpiler.Compiler)
        transpileFunction = traceurTranspile;
      else if (transpiler.createLanguageService)
        transpileFunction = typescriptTranspile;
      else
        transpileFunction = babelTranspile;

      // note __moduleName will be part of the transformer meta in future when we have the spec for this
      return '(function(__moduleName){' + transpileFunction.call(self, load, transpiler) + '\n})("' + load.name + '");\n//# sourceURL=' + load.address + '!transpiled';
    });
  };

  function traceurTranspile(load, traceur) {
    var options = this.traceurOptions || {};
    options.modules = 'instantiate';
    options.script = false;
    if (options.sourceMaps === undefined)
      options.sourceMaps = 'inline';
    options.filename = load.address;
    options.inputSourceMap = load.metadata.sourceMap;
    options.moduleName = false;

    var compiler = new traceur.Compiler(options);

    return doTraceurCompile(load.source, compiler, options.filename);
  }
  function doTraceurCompile(source, compiler, filename) {
    try {
      return compiler.compile(source, filename);
    }
    catch(e) {
      // on older versions of traceur (<0.9.3), an array of errors is thrown
      // rather than a single error.
      if (e.length) {
        throw e[0];
      }
      throw e;
    }
  }

  function babelTranspile(load, babel) {
    var options = this.babelOptions || {};
    options.modules = 'system';
    if (options.sourceMap === undefined)
      options.sourceMap = 'inline';
    options.inputSourceMap = load.metadata.sourceMap;
    options.filename = load.address;
    options.code = true;
    options.ast = false;

    return babel.transform(load.source, options).code;
  }

  function typescriptTranspile(load, ts) {
    var options = this.typescriptOptions || {};
    options.target = options.target || ts.ScriptTarget.ES5;
    if (options.sourceMap === undefined)
      options.sourceMap = true;
    if (options.sourceMap && options.inlineSourceMap !== false)
      options.inlineSourceMap = true;

    options.module = ts.ModuleKind.System;

    return ts.transpile(load.source, options, load.address);
  }

  return transpile;
})();
// SystemJS Loader Class and Extension helpers

function SystemJSLoader() {
  SystemLoader.call(this);

  systemJSConstructor.call(this);
}

// inline Object.create-style class extension
function SystemProto() {};
SystemProto.prototype = SystemLoader.prototype;
SystemJSLoader.prototype = new SystemProto();
SystemJSLoader.prototype.constructor = SystemJSLoader;

// remove ESML instantiate
SystemJSLoader.prototype.instantiate = function() {};

var systemJSConstructor;

function hook(name, hook) {
  SystemJSLoader.prototype[name] = hook(SystemJSLoader.prototype[name] || function() {});
}
function hookConstructor(hook) {
  systemJSConstructor = hook(systemJSConstructor || function() {});
}

function dedupe(deps) {
  var newDeps = [];
  for (var i = 0, l = deps.length; i < l; i++)
    if (indexOf.call(newDeps, deps[i]) == -1)
      newDeps.push(deps[i])
  return newDeps;
}

function group(deps) {
  var names = [];
  var indices = [];
  for (var i = 0, l = deps.length; i < l; i++) {
    var index = indexOf.call(names, deps[i]);
    if (index === -1) {
      names.push(deps[i]);
      indices.push([i]);
    }
    else {
      indices[index].push(i);
    }
  }
  return { names: names, indices: indices };
}

var getOwnPropertyDescriptor = true;
try {
  Object.getOwnPropertyDescriptor({ a: 0 }, 'a');
}
catch(e) {
  getOwnPropertyDescriptor = false;
}

// converts any module.exports object into an object ready for SystemJS.newModule
function getESModule(exports) {
  var esModule = {};
  // don't trigger getters/setters in environments that support them
  if (typeof exports == 'object' || typeof exports == 'function') {
    var hasOwnProperty = exports && exports.hasOwnProperty;
    if (getOwnPropertyDescriptor) {
      for (var p in exports) {
        if (!trySilentDefineProperty(esModule, exports, p))
          setPropertyIfHasOwnProperty(esModule, exports, p, hasOwnProperty);
      }
    }
    else {
      for (var p in exports)
        setPropertyIfHasOwnProperty(esModule, exports, p, hasOwnProperty);
    }
  }
  esModule['default'] = exports;
  defineProperty(esModule, '__useDefault', {
    value: true
  });
  return esModule;
}

function setPropertyIfHasOwnProperty(targetObj, sourceObj, propName, hasOwnProperty) {
  if (!hasOwnProperty || sourceObj.hasOwnProperty(propName))
    targetObj[propName] = sourceObj[propName];
}

function trySilentDefineProperty(targetObj, sourceObj, propName) {
  try {
    var d;
    if (d = Object.getOwnPropertyDescriptor(sourceObj, propName))
      defineProperty(targetObj, propName, d);

    return true;
  } catch (ex) {
    // Object.getOwnPropertyDescriptor threw an exception, fall back to normal set property.
    return false;
  }
}

function extend(a, b, prepend) {
  for (var p in b) {
    if (!prepend || !(p in a))
      a[p] = b[p];
  }
  return a;
}

// package configuration options
var packageProperties = ['main', 'format', 'defaultExtension', 'meta', 'map', 'basePath', 'depCache'];

// meta first-level extends where:
// array + array appends
// object + object extends
// other properties replace
function extendMeta(a, b, prepend) {
  for (var p in b) {
    var val = b[p];
    if (!(p in a))
      a[p] = val;
    else if (val instanceof Array && a[p] instanceof Array)
      a[p] = [].concat(prepend ? val : a[p]).concat(prepend ? a[p] : val);
    else if (typeof val == 'object' && val !== null && typeof a[p] == 'object')
      a[p] = extend(extend({}, a[p]), val, prepend);
    else if (!prepend)
      a[p] = val;
  }
}

function warn(msg) {
  if (this.warnings && typeof console != 'undefined' && console.warn)
    console.warn(msg);
}
// we define a __exec for globally-scoped execution
// used by module format implementations
var __exec;

(function() {

  var hasBtoa = typeof btoa != 'undefined';

  function getSource(load) {
    var lastLineIndex = load.source.lastIndexOf('\n');

    // wrap ES formats with a System closure for System global encapsulation
    var wrap = load.metadata.format != 'global';

    var sourceMap = load.metadata.sourceMap;
    if (sourceMap) {
      if (typeof sourceMap != 'object')
        throw new TypeError('load.metadata.sourceMap must be set to an object.');

      sourceMap = JSON.stringify(sourceMap);
    }

    return (wrap ? '(function(System, SystemJS) {' : '') + load.source + (wrap ? '\n})(System, System);' : '')
        // adds the sourceURL comment if not already present
        + (load.source.substr(lastLineIndex, 15) != '\n//# sourceURL=' 
          ? '\n//# sourceURL=' + load.address + (sourceMap ? '!transpiled' : '') : '')
        // add sourceMappingURL if load.metadata.sourceMap is set
        + (sourceMap && hasBtoa && '\n//# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(sourceMap))) || '');
  }

  var curLoad;

  // System.register, System.registerDynamic, AMD define pipeline
  // if currently evalling code here, immediately reduce the registered entry against the load record
  hook('pushRegister_', function() {
    return function(register) {
      if (!curLoad)
        return false;

      this.reduceRegister_(curLoad, register);
      return true;
    };
  });

  // System clobbering protection (mostly for Traceur)
  var curSystem;
  var callCounter = 0;
  function preExec(loader, load) {
    curLoad = load;
    if (callCounter++ == 0)
      curSystem = __global.System;
    __global.System = __global.SystemJS = loader; 
  }
  function postExec() {
    if (--callCounter == 0)
      __global.System = __global.SystemJS = curSystem;
    curLoad = undefined;
  }

  var vm;
  __exec = function(load) {
    if (!load.source)
      return;
    if ((load.metadata.integrity || load.metadata.nonce) && supportsScriptExec)
      return scriptExec.call(this, load);
    try {
      preExec(this, load);
      curLoad = load;
      // global scoped eval for node (avoids require scope leak)
      if (this._nodeRequire) {
        vm = vm || this._nodeRequire('vm');
        vm.runInThisContext(getSource(load));
      }
      else {
        (0, eval)(getSource(load));
      }
      postExec();
    }
    catch(e) {
      postExec(); 
      throw addToError(e, 'Evaluating ' + load.address);
    }
  };

  var supportsScriptExec = false;
  if (isBrowser && typeof document != 'undefined' && document.getElementsByTagName) {
    var scripts = document.getElementsByTagName('script');
    $__curScript = scripts[scripts.length - 1];

    if (!(window.chrome && window.chrome.extension || navigator.userAgent.match(/^Node\.js/)))
      supportsScriptExec = true;
  }

  // script execution via injecting a script tag into the page
  // this allows CSP integrity and nonce to be set for CSP environments
  var head;
  function scriptExec(load) {
    if (!head)
      head = document.head || document.body || document.documentElement;

    var script = document.createElement('script');
    script.text = getSource(load, false);
    var onerror = window.onerror;
    var e;
    window.onerror = function(_e) {
      e = addToError(_e, 'Evaluating ' + load.address);
    }
    preExec(this, load);

    if (load.metadata.integrity)
      script.setAttribute('integrity', load.metadata.integrity);
    if (load.metadata.nonce)
      script.setAttribute('nonce', load.metadata.nonce);

    head.appendChild(script);
    head.removeChild(script);
    postExec();
    window.onerror = onerror;
    if (e)
      throw e;
  }

})();
var absURLRegEx = /^[^\/]+:\/\//;

function readMemberExpression(p, value) {
  var pParts = p.split('.');
  while (pParts.length)
    value = value[pParts.shift()];
  return value;
}

var baseURLCache = {};
function getBaseURLObj() {
  if (baseURLCache[this.baseURL])
    return baseURLCache[this.baseURL];

  // normalize baseURL if not already
  if (this.baseURL[this.baseURL.length - 1] != '/')
    this.baseURL += '/';

  var baseURL = new URL(this.baseURL, baseURI);

  this.baseURL = baseURL.href;

  return (baseURLCache[this.baseURL] = baseURL);
}

function getMapMatch(map, name) {
  var bestMatch, bestMatchLength = 0;

  for (var p in map) {
    if (name.substr(0, p.length) == p && (name.length == p.length || name[p.length] == '/')) {
      var curMatchLength = p.split('/').length;
      if (curMatchLength <= bestMatchLength)
        continue;
      bestMatch = p;
      bestMatchLength = curMatchLength;
    }
  }

  return bestMatch;
}

function setProduction(isProduction) {
  this.set('@system-env', this.newModule({
    browser: isBrowser,
    node: !!this._nodeRequire,
    production: isProduction,
    'default': true
  }));
}

var baseURIObj = new URL(baseURI);

hookConstructor(function(constructor) {
  return function() {
    constructor.call(this);

    // support baseURL
    this.baseURL = baseURI.substr(0, baseURI.lastIndexOf('/') + 1);

    // support map and paths
    this.map = {};
    this.paths = {};

    // global behaviour flags
    this.warnings = false;
    this.defaultJSExtensions = false;
    this.pluginFirst = false;
    this.loaderErrorStack = false;

    // by default load ".json" files as json
    // leading * meta doesn't need normalization
    // NB add this in next breaking release
    // this.meta['*.json'] = { format: 'json' };

    // support the empty module, as a concept
    this.set('@empty', this.newModule({}));

    setProduction.call(this, false);
  };
});

// include the node require since we're overriding it
if (typeof require != 'undefined' && typeof process != 'undefined' && !process.browser)
  SystemJSLoader.prototype._nodeRequire = require;

var nodeCoreModules = ['assert', 'buffer', 'child_process', 'cluster', 'console', 'constants', 
    'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https', 'module', 'net', 'os', 'path', 
    'process', 'punycode', 'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'sys', 'timers', 
    'tls', 'tty', 'url', 'util', 'vm', 'zlib'];

/*
  Core SystemJS Normalization

  If a name is relative, we apply URL normalization to the page
  If a name is an absolute URL, we leave it as-is

  Plain names (neither of the above) run through the map and paths
  normalization phases.

  The paths normalization phase applies last (paths extension), which
  defines the `decanonicalize` function and normalizes everything into
  a URL.
 */

function isPlain(name) {
  return (name[0] != '.' || (!!name[1] && name[1] != '/' && name[1] != '.')) && name[0] != '/' && !name.match(absURLRegEx);
}

function urlResolve(name, parent) {
  if (parent)
    parent = parent.replace(/#/g, '%05');
  return new URL(name, parent || baseURIObj).href.replace(/%05/g, '#');
}

// only applies to plain names
function baseURLResolve(loader, name) {
  return new URL(name, getBaseURLObj.call(loader)).href;
}

function coreResolve(name, parentName) {
  // standard URL resolution
  if (!isPlain(name))
    return urlResolve(name, parentName);

  // plain names not starting with './', '://' and '/' go through custom resolution
  var mapMatch = getMapMatch(this.map, name);

  if (mapMatch) {
    name = this.map[mapMatch] + name.substr(mapMatch.length);

    if (!isPlain(name))
      return urlResolve(name);
  }

  if (this.has(name))
    return name;
  // dynamically load node-core modules when requiring `@node/fs` for example
  if (name.substr(0, 6) == '@node/' && nodeCoreModules.indexOf(name.substr(6)) != -1) {
    if (!this._nodeRequire)
      throw new TypeError('Error loading ' + name + '. Can only load node core modules in Node.');
    this.set(name, this.newModule(getESModule(this._nodeRequire(name.substr(6)))));
    return name;
  }

  var pathed = applyPaths(this.paths, name);

  if (pathed && !isPlain(pathed))
    return urlResolve(pathed);

  return baseURLResolve(this, pathed || name);
}

hook('normalize', function(normalize) {
  return function(name, parentName, skipExt) {
    var resolved = coreResolve.call(this, name, parentName);
    if (!skipExt && this.defaultJSExtensions && resolved.substr(resolved.length - 3, 3) != '.js' && !isPlain(resolved))
      resolved += '.js';
    return resolved;
  };
});

// percent encode just '#' in urls if using HTTP requests
var httpRequest = typeof XMLHttpRequest != 'undefined';
hook('locate', function(locate) {
  return function(load) {
    return Promise.resolve(locate.call(this, load))
    .then(function(address) {
      if (httpRequest)
        return address.replace(/#/g, '%23');
      return address;
    });
  };
});

/*
 * Fetch with authorization
 */
hook('fetch', function() {
  return function(load) {
    return new Promise(function(resolve, reject) {
      fetchTextFromURL(load.address, load.metadata.authorization, resolve, reject);
    });
  };
});

/*
  __useDefault
  
  When a module object looks like:
  newModule(
    __useDefault: true,
    default: 'some-module'
  })

  Then importing that module provides the 'some-module'
  result directly instead of the full module.

  Useful for eg module.exports = function() {}
*/
hook('import', function(systemImport) {
  return function(name, parentName, parentAddress) {
    if (parentName && parentName.name)
      warn.call(this, 'SystemJS.import(name, { name: parentName }) is deprecated for SystemJS.import(name, parentName), while importing ' + name + ' from ' + parentName.name);
    return systemImport.call(this, name, parentName, parentAddress).then(function(module) {
      return module.__useDefault ? module['default'] : module;
    });
  };
});

/*
 * Allow format: 'detect' meta to enable format detection
 */
hook('translate', function(systemTranslate) {
  return function(load) {
    if (load.metadata.format == 'detect')
      load.metadata.format = undefined;
    return systemTranslate.call(this, load);
  };
});


/*
 * JSON format support
 *
 * Supports loading JSON files as a module format itself
 *
 * Usage:
 *
 * SystemJS.config({
 *   meta: {
 *     '*.json': { format: 'json' }
 *   }
 * });
 *
 * Module is returned as if written:
 *
 * export default {JSON}
 *
 * No named exports are provided
 *
 * Files ending in ".json" are treated as json automatically by SystemJS
 */
hook('instantiate', function(instantiate) {
  return function(load) {
    if (load.metadata.format == 'json' && !this.builder) {
      var entry = load.metadata.entry = createEntry();
      entry.deps = [];
      entry.execute = function() {
        try {
          return JSON.parse(load.source);
        }
        catch(e) {
          throw new Error("Invalid JSON file " + load.name);
        }
      };
    }
  };
})

/*
 Extend config merging one deep only

  loader.config({
    some: 'random',
    config: 'here',
    deep: {
      config: { too: 'too' }
    }
  });

  <=>

  loader.some = 'random';
  loader.config = 'here'
  loader.deep = loader.deep || {};
  loader.deep.config = { too: 'too' };


  Normalizes meta and package configs allowing for:

  SystemJS.config({
    meta: {
      './index.js': {}
    }
  });

  To become

  SystemJS.meta['https://thissite.com/index.js'] = {};

  For easy normalization canonicalization with latest URL support.

*/
SystemJSLoader.prototype.env = 'development';

var curCurScript;
SystemJSLoader.prototype.config = function(cfg) {
  var loader = this;

  if ('loaderErrorStack' in cfg) {
    curCurScript = $__curScript;
    if (cfg.loaderErrorStack)
      $__curScript = undefined;
    else
      $__curScript = curCurScript;
  }

  if ('warnings' in cfg)
    loader.warnings = cfg.warnings;

  // transpiler deprecation path
  if (cfg.transpilerRuntime === false)
    loader._loader.loadedTranspilerRuntime = true;

  // always configure baseURL first
  if (cfg.baseURL) {
    var hasConfig = false;
    function checkHasConfig(obj) {
      for (var p in obj)
        if (hasOwnProperty.call(obj, p))
          return true;
    }
    if (checkHasConfig(loader.packages) || checkHasConfig(loader.meta) || checkHasConfig(loader.depCache) || checkHasConfig(loader.bundles) || checkHasConfig(loader.packageConfigPaths))
      throw new TypeError('Incorrect configuration order. The baseURL must be configured with the first SystemJS.config call.');

    loader.baseURL = cfg.baseURL;

    // sanitize baseURL
    getBaseURLObj.call(loader);
  }

  if (cfg.defaultJSExtensions) {
    loader.defaultJSExtensions = cfg.defaultJSExtensions;
    warn.call(loader, 'The defaultJSExtensions configuration option is deprecated, use packages configuration instead.');
  }

  if (cfg.pluginFirst)
    loader.pluginFirst = cfg.pluginFirst;

  if (cfg.production)
    setProduction.call(loader, true);

  if (cfg.paths) {
    for (var p in cfg.paths)
      loader.paths[p] = cfg.paths[p];
  }

  if (cfg.map) {
    var objMaps = '';
    for (var p in cfg.map) {
      var v = cfg.map[p];

      // object map backwards-compat into packages configuration
      if (typeof v !== 'string') {
        objMaps += (objMaps.length ? ', ' : '') + '"' + p + '"';

        var defaultJSExtension = loader.defaultJSExtensions && p.substr(p.length - 3, 3) != '.js';
        var prop = loader.decanonicalize(p);
        if (defaultJSExtension && prop.substr(prop.length - 3, 3) == '.js')
          prop = prop.substr(0, prop.length - 3);

        // if a package main, revert it
        var pkgMatch = '';
        for (var pkg in loader.packages) {
          if (prop.substr(0, pkg.length) == pkg 
              && (!prop[pkg.length] || prop[pkg.length] == '/') 
              && pkgMatch.split('/').length < pkg.split('/').length)
            pkgMatch = pkg;
        }
        if (pkgMatch && loader.packages[pkgMatch].main)
          prop = prop.substr(0, prop.length - loader.packages[pkgMatch].main.length - 1);

        var pkg = loader.packages[prop] = loader.packages[prop] || {};
        pkg.map = v;
      }
      else {
        loader.map[p] = v;
      }
    }
    if (objMaps)
      warn.call(loader, 'The map configuration for ' + objMaps + ' uses object submaps, which is deprecated in global map.\nUpdate this to use package contextual map with configs like SystemJS.config({ packages: { "' + p + '": { map: {...} } } }).');
  }

  if (cfg.packageConfigPaths) {
    var packageConfigPaths = [];
    for (var i = 0; i < cfg.packageConfigPaths.length; i++) {
      var path = cfg.packageConfigPaths[i];
      var packageLength = Math.max(path.lastIndexOf('*') + 1, path.lastIndexOf('/'));
      var defaultJSExtension = loader.defaultJSExtensions && path.substr(packageLength - 3, 3) != '.js';
      var normalized = loader.decanonicalize(path.substr(0, packageLength));
      if (defaultJSExtension && normalized.substr(normalized.length - 3, 3) == '.js')
        normalized = normalized.substr(0, normalized.length - 3);
      packageConfigPaths[i] = normalized + path.substr(packageLength);
    }
    loader.packageConfigPaths = packageConfigPaths;
  }

  if (cfg.bundles) {
    for (var p in cfg.bundles) {
      var bundle = [];
      for (var i = 0; i < cfg.bundles[p].length; i++) {
        var defaultJSExtension = loader.defaultJSExtensions && cfg.bundles[p][i].substr(cfg.bundles[p][i].length - 3, 3) != '.js';
        var normalizedBundleDep = loader.decanonicalize(cfg.bundles[p][i]);
        if (defaultJSExtension && normalizedBundleDep.substr(normalizedBundleDep.length - 3, 3) == '.js')
          normalizedBundleDep = normalizedBundleDep.substr(0, normalizedBundleDep.length - 3);
        bundle.push(normalizedBundleDep);
      }
      loader.bundles[p] = bundle;
    }
  }

  if (cfg.packages) {
    for (var p in cfg.packages) {
      if (p.match(/^([^\/]+:)?\/\/$/))
        throw new TypeError('"' + p + '" is not a valid package name.');

      var prop = coreResolve.call(loader, p);

      // allow trailing slash in packages
      if (prop[prop.length - 1] == '/')
        prop = prop.substr(0, prop.length - 1);

      loader.packages[prop] = loader.packages[prop] || {};

      var pkg = cfg.packages[p];

      // meta backwards compatibility
      if (pkg.modules) {
        warn.call(loader, 'Package ' + p + ' is configured with "modules", which is deprecated as it has been renamed to "meta".');
        pkg.meta = pkg.modules;
        delete pkg.modules;
      }

      if (typeof pkg.main == 'object') {
        pkg.map = pkg.map || {};
        pkg.map['./@main'] = pkg.main;
        pkg.main['default'] = pkg.main['default'] || './';
        pkg.main = '@main';
      }

      for (var q in pkg)
        if (indexOf.call(packageProperties, q) == -1)
          warn.call(loader, '"' + q + '" is not a valid package configuration option in package ' + p);

      extendMeta(loader.packages[prop], pkg);
    }
  }

  for (var c in cfg) {
    var v = cfg[c];

    if (c == 'baseURL' || c == 'map' || c == 'packages' || c == 'bundles' || c == 'paths' || c == 'warnings' || c == 'packageConfigPaths' || c == 'loaderErrorStack')
      continue;

    if (typeof v != 'object' || v instanceof Array) {
      loader[c] = v;
    }
    else {
      loader[c] = loader[c] || {};

      for (var p in v) {
        // base-level wildcard meta does not normalize to retain catch-all quality
        if (c == 'meta' && p[0] == '*') {
          loader[c][p] = v[p];
        }
        else if (c == 'meta') {
          // meta can go through global map, with defaultJSExtensions adding
          var resolved = coreResolve.call(loader, p);
          if (loader.defaultJSExtensions && resolved.substr(resolved.length - 3, 3) != '.js' && !isPlain(resolved))
            resolved += '.js';
          loader[c][resolved] = v[p];
        }
        else if (c == 'depCache') {
          var defaultJSExtension = loader.defaultJSExtensions && p.substr(p.length - 3, 3) != '.js';
          var prop = loader.decanonicalize(p);
          if (defaultJSExtension && prop.substr(prop.length - 3, 3) == '.js')
            prop = prop.substr(0, prop.length - 3);
          loader[c][prop] = v[p];
        }
        else {
          loader[c][p] = v[p];
        }
      }
    }
  }
};/*
 * Package Configuration Extension
 *
 * Example:
 *
 * SystemJS.packages = {
 *   jquery: {
 *     main: 'index.js', // when not set, package name is requested directly
 *     format: 'amd',
 *     defaultExtension: 'ts', // defaults to 'js', can be set to false
 *     modules: {
 *       '*.ts': {
 *         loader: 'typescript'
 *       },
 *       'vendor/sizzle.js': {
 *         format: 'global'
 *       }
 *     },
 *     map: {
 *        // map internal require('sizzle') to local require('./vendor/sizzle')
 *        sizzle: './vendor/sizzle.js',
 *        // map any internal or external require of 'jquery/vendor/another' to 'another/index.js'
 *        './vendor/another.js': './another/index.js',
 *        // test.js / test -> lib/test.js
 *        './test.js': './lib/test.js',
 *
 *        // environment-specific map configurations
 *        './index.js': {
 *          '~browser': './index-node.js'
 *        }
 *     },
 *     // allows for setting package-prefixed depCache
 *     // keys are normalized module names relative to the package itself
 *     depCache: {
 *       // import 'package/index.js' loads in parallel package/lib/test.js,package/vendor/sizzle.js
 *       './index.js': ['./test'],
 *       './test.js': ['external-dep'],
 *       'external-dep/path.js': ['./another.js']
 *     }
 *   }
 * };
 *
 * Then:
 *   import 'jquery'                       -> jquery/index.js
 *   import 'jquery/submodule'             -> jquery/submodule.js
 *   import 'jquery/submodule.ts'          -> jquery/submodule.ts loaded as typescript
 *   import 'jquery/vendor/another'        -> another/index.js
 *
 * Detailed Behaviours
 * - main can have a leading "./" can be added optionally
 * - map and defaultExtension are applied to the main
 * - defaultExtension adds the extension only if the exact extension is not present
 * - defaultJSExtensions applies after map when defaultExtension is not set
 * - if a meta value is available for a module, map and defaultExtension are skipped
 * - like global map, package map also applies to subpaths (sizzle/x, ./vendor/another/sub)
 * - condition module map is '@env' module in package or '@system-env' globally
 * - map targets support conditional interpolation ('./x': './x.#{|env}.js')
 * - internal package map targets cannot use boolean conditionals
 *
 * Package Configuration Loading
 *
 * Not all packages may already have their configuration present in the System config
 * For these cases, a list of packageConfigPaths can be provided, which when matched against
 * a request, will first request a ".json" file by the package name to derive the package
 * configuration from. This allows dynamic loading of non-predetermined code, a key use
 * case in SystemJS.
 *
 * Example:
 *
 *   SystemJS.packageConfigPaths = ['packages/test/package.json', 'packages/*.json'];
 *
 *   // will first request 'packages/new-package/package.json' for the package config
 *   // before completing the package request to 'packages/new-package/path'
 *   SystemJS.import('packages/new-package/path');
 *
 *   // will first request 'packages/test/package.json' before the main
 *   SystemJS.import('packages/test');
 *
 * When a package matches packageConfigPaths, it will always send a config request for
 * the package configuration.
 * The package name itself is taken to be the match up to and including the last wildcard
 * or trailing slash.
 * The most specific package config path will be used.
 * Any existing package configurations for the package will deeply merge with the
 * package config, with the existing package configurations taking preference.
 * To opt-out of the package configuration request for a package that matches
 * packageConfigPaths, use the { configured: true } package config option.
 *
 */
(function() {

  hookConstructor(function(constructor) {
    return function() {
      constructor.call(this);
      this.packages = {};
      this.packageConfigPaths = [];
    };
  });

  function getPackage(loader, normalized) {
    // use most specific package
    var curPkg, curPkgLen = 0, pkgLen;
    for (var p in loader.packages) {
      if (normalized.substr(0, p.length) === p && (normalized.length === p.length || normalized[p.length] === '/')) {
        pkgLen = p.split('/').length;
        if (pkgLen > curPkgLen) {
          curPkg = p;
          curPkgLen = pkgLen;
        }
      }
    }
    return curPkg;
  }

  function addDefaultExtension(loader, pkg, pkgName, subPath, skipExtensions) {
    // don't apply extensions to folders or if defaultExtension = false
    if (!subPath || subPath[subPath.length - 1] == '/' || skipExtensions || pkg.defaultExtension === false)
      return subPath;

    // NB are you sure about this?
    // skip if we have interpolation conditional syntax in subPath?
    if (subPath.match(interpolationRegEx))
      return subPath;

    var metaMatch = false;

    // exact meta or meta with any content after the last wildcard skips extension
    if (pkg.meta)
      getMetaMatches(pkg.meta, subPath, function(metaPattern, matchMeta, matchDepth) {
        if (matchDepth == 0 || metaPattern.lastIndexOf('*') != metaPattern.length - 1)
          return metaMatch = true;
      });

    // exact global meta or meta with any content after the last wildcard skips extension
    if (!metaMatch && loader.meta)
      getMetaMatches(loader.meta, pkgName + '/' + subPath, function(metaPattern, matchMeta, matchDepth) {
        if (matchDepth == 0 || metaPattern.lastIndexOf('*') != metaPattern.length - 1)
          return metaMatch = true;
      });

    if (metaMatch)
      return subPath;

    // work out what the defaultExtension is and add if not there already
    // NB reconsider if default should really be ".js"?
    var defaultExtension = '.' + (pkg.defaultExtension || 'js');
    if (subPath.substr(subPath.length - defaultExtension.length) != defaultExtension)
      return subPath + defaultExtension;
    else
      return subPath;
  }

  function applyPackageConfigSync(loader, pkg, pkgName, subPath, skipExtensions) {
    // main
    if (!subPath) {
      if (pkg.main)
        subPath = pkg.main.substr(0, 2) == './' ? pkg.main.substr(2) : pkg.main;
      // also no submap if name is package itself (import 'pkg' -> 'path/to/pkg.js')
      else
        // NB can add a default package main convention here when defaultJSExtensions is deprecated
        // if it becomes internal to the package then it would no longer be an exit path
        return pkgName + (loader.defaultJSExtensions ? '.js' : '');
    }

    // map config checking without then with extensions
    if (pkg.map) {
      var mapPath = './' + subPath;

      var mapMatch = getMapMatch(pkg.map, mapPath);

      // we then check map with the default extension adding
      if (!mapMatch) {
        mapPath = './' + addDefaultExtension(loader, pkg, pkgName, subPath, skipExtensions);
        if (mapPath != './' + subPath)
          mapMatch = getMapMatch(pkg.map, mapPath);
      }
      if (mapMatch)
        return doMapSync(loader, pkg, pkgName, mapMatch, mapPath, skipExtensions);
    }

    // normal package resolution
    return pkgName + '/' + addDefaultExtension(loader, pkg, pkgName, subPath, skipExtensions);
  }

  function validateMapping(mapMatch, mapped, pkgName) {
    // disallow internal to subpath maps
    if (mapMatch == '.')
      throw new Error('Package ' + pkgName + ' has a map entry for "." which is not permitted.');
    // disallow internal ./x -> ./x/y recursive maps
    else if (mapped.substr(0, mapMatch.length) == mapMatch && (mapMatch[mapMatch.length - 1] != '/' && mapped[mapMatch.length] == '/'))
      throw new Error('Package ' + pkgName + ' has a recursive map for "' + mapMatch + '" which is not permitted.');
  }

  function doMapSync(loader, pkg, pkgName, mapMatch, path, skipExtensions) {
    var mapped = pkg.map[mapMatch];

    if (typeof mapped == 'object')
      throw new Error('Synchronous conditional normalization not supported sync normalizing ' + mapMatch + ' in ' + pkgName);

    validateMapping(mapMatch, mapped, pkgName);

    // ignore conditionals in sync
    if (typeof mapped != 'string')
      mapped = mapMatch = path;

    validateMapping(mapMatch, mapped, pkgName);

    // package map to main / base-level
    if (mapped == '.')
      mapped = pkgName;

    // internal package map
    else if (mapped.substr(0, 2) == './')
      return pkgName + '/' + addDefaultExtension(loader, pkg, pkgName, mapped.substr(2) + path.substr(mapMatch.length), skipExtensions);
    
    // external map reference
    return loader.normalizeSync(mapped + path.substr(mapMatch.length), pkgName + '/');
  }

  function applyPackageConfig(loader, pkg, pkgName, subPath, skipExtensions) {
    // main
    if (!subPath) {
      if (pkg.main)
        subPath = pkg.main.substr(0, 2) == './' ? pkg.main.substr(2) : pkg.main;
      // also no submap if name is package itself (import 'pkg' -> 'path/to/pkg.js')
      else
        // NB can add a default package main convention here when defaultJSExtensions is deprecated
        // if it becomes internal to the package then it would no longer be an exit path
        return Promise.resolve(pkgName + (loader.defaultJSExtensions ? '.js' : ''));
    }

    // map config checking without then with extensions
    var mapPath, mapMatch;

    if (pkg.map) {
      mapPath = './' + subPath;
      mapMatch = getMapMatch(pkg.map, mapPath);

      // we then check map with the default extension adding
      if (!mapMatch) {
        mapPath = './' + addDefaultExtension(loader, pkg, pkgName, subPath, skipExtensions);
        if (mapPath != './' + subPath)
          mapMatch = getMapMatch(pkg.map, mapPath);
      }
    }

    return (mapMatch ? doMap(loader, pkg, pkgName, mapMatch, mapPath, skipExtensions) : Promise.resolve())
    .then(function(mapped) {
      if (mapped)
        return Promise.resolve(mapped);

      // normal package resolution / fallback resolution for no conditional match
      return Promise.resolve(pkgName + '/' + addDefaultExtension(loader, pkg, pkgName, subPath, skipExtensions));
    });
  }

  function doStringMap(loader, pkg, pkgName, mapMatch, mapped, path, skipExtensions) {
    // NB the interpolation cases should strictly skip subsequent interpolation

    // package map to main / base-level
    if (mapped == '.')
      mapped = pkgName;
    
    // internal package map
    else if (mapped.substr(0, 2) == './')
      return Promise.resolve(pkgName + '/' + addDefaultExtension(loader, pkg, pkgName, mapped.substr(2) + path.substr(mapMatch.length), skipExtensions))
      .then(function(name) {
        return interpolateConditional.call(loader, name, pkgName + '/');
      });
    
    // external map reference
    return loader.normalize(mapped + path.substr(mapMatch.length), pkgName + '/');
  }

  function doMap(loader, pkg, pkgName, mapMatch, path, skipExtensions) {
    var mapped = pkg.map[mapMatch];

    if (typeof mapped == 'string') {
      validateMapping(mapMatch, mapped, pkgName);
      return doStringMap(loader, pkg, pkgName, mapMatch, mapped, path, skipExtensions);
    }

    // we use a special conditional syntax to allow the builder to handle conditional branch points further
    if (loader.builder)
      return Promise.resolve(pkgName + '/#:' + path);

    // map object -> conditional map
    return loader['import'](pkg.map['@env'] || '@system-env', pkgName)
    .then(function(env) {
      // first map condition to match is used
      for (var e in mapped) {
        var negate = e[0] == '~';

        var value = readMemberExpression(negate ? e.substr(1) : e, env);

        if (!negate && value || negate && !value)
          return mapped[e];
      }
    })
    .then(function(mapped) {
      if (mapped) {
        if (typeof mapped != 'string')
          throw new Error('Unable to map a package conditional to a package conditional.');
        validateMapping(mapMatch, mapped, pkgName);
        return doStringMap(loader, pkg, pkgName, mapMatch, mapped, path, skipExtensions);
      }

      // no environment match -> fallback to original subPath by returning undefined
    });
  }

  // normalizeSync = decanonicalize + package resolution
  SystemJSLoader.prototype.normalizeSync = SystemJSLoader.prototype.decanonicalize = SystemJSLoader.prototype.normalize;

  // decanonicalize must JUST handle package defaultExtension: false case when defaultJSExtensions is set
  // to be deprecated!
  hook('decanonicalize', function(decanonicalize) {
    return function(name, parentName) {
      if (this.builder)
        return decanonicalize.call(this, name, parentName, true);

      var decanonicalized = decanonicalize.call(this, name, parentName);

      if (!this.defaultJSExtensions)
        return decanonicalized;
    
      var pkgName = getPackage(this, decanonicalized);

      var pkg = this.packages[pkgName];
      var defaultExtension = pkg && pkg.defaultExtension;

      if (defaultExtension == undefined && pkg && pkg.meta)
        getMetaMatches(pkg.meta, decanonicalized.substr(pkgName), function(metaPattern, matchMeta, matchDepth) {
          if (matchDepth == 0 || metaPattern.lastIndexOf('*') != metaPattern.length - 1) {
            defaultExtension = false;
            return true;
          }
        });
      
      if ((defaultExtension === false || defaultExtension && defaultExtension != '.js') && name.substr(name.length - 3, 3) != '.js' && decanonicalized.substr(decanonicalized.length - 3, 3) == '.js')
        decanonicalized = decanonicalized.substr(0, decanonicalized.length - 3);

      return decanonicalized;
    };
  });

  hook('normalizeSync', function(normalizeSync) {
    return function(name, parentName, isPlugin) {
      warn.call(this, 'SystemJS.normalizeSync has been deprecated for SystemJS.decanonicalize.');

      var loader = this;
      isPlugin = isPlugin === true;

      // apply contextual package map first
      // (we assume the parent package config has already been loaded)
      if (parentName)
        var parentPackageName = getPackage(loader, parentName) ||
            loader.defaultJSExtensions && parentName.substr(parentName.length - 3, 3) == '.js' &&
            getPackage(loader, parentName.substr(0, parentName.length - 3));

      var parentPackage = parentPackageName && loader.packages[parentPackageName];

      // ignore . since internal maps handled by standard package resolution
      if (parentPackage && name[0] != '.') {
        var parentMap = parentPackage.map;
        var parentMapMatch = parentMap && getMapMatch(parentMap, name);

        if (parentMapMatch && typeof parentMap[parentMapMatch] == 'string')
          return doMapSync(loader, parentPackage, parentPackageName, parentMapMatch, name, isPlugin);
      }

      var defaultJSExtension = loader.defaultJSExtensions && name.substr(name.length - 3, 3) != '.js';

      // apply map, core, paths, contextual package map
      var normalized = normalizeSync.call(loader, name, parentName);

      // undo defaultJSExtension
      if (defaultJSExtension && normalized.substr(normalized.length - 3, 3) != '.js')
        defaultJSExtension = false;
      if (defaultJSExtension)
        normalized = normalized.substr(0, normalized.length - 3);

      var pkgConfigMatch = getPackageConfigMatch(loader, normalized);
      var pkgName = pkgConfigMatch && pkgConfigMatch.packageName || getPackage(loader, normalized);

      if (!pkgName)
        return normalized + (defaultJSExtension ? '.js' : '');

      var subPath = normalized.substr(pkgName.length + 1);

      return applyPackageConfigSync(loader, loader.packages[pkgName] || {}, pkgName, subPath, isPlugin);
    };
  });

  hook('normalize', function(normalize) {
    return function(name, parentName, isPlugin) {
      var loader = this;
      isPlugin = isPlugin === true;

      return Promise.resolve()
      .then(function() {
        // apply contextual package map first
        // (we assume the parent package config has already been loaded)
        if (parentName)
          var parentPackageName = getPackage(loader, parentName) ||
              loader.defaultJSExtensions && parentName.substr(parentName.length - 3, 3) == '.js' &&
              getPackage(loader, parentName.substr(0, parentName.length - 3));

        var parentPackage = parentPackageName && loader.packages[parentPackageName];

        // ignore . since internal maps handled by standard package resolution
        if (parentPackage && name.substr(0, 2) != './') {
          var parentMap = parentPackage.map;
          var parentMapMatch = parentMap && getMapMatch(parentMap, name);

          if (parentMapMatch)
            return doMap(loader, parentPackage, parentPackageName, parentMapMatch, name, isPlugin);
        }

        return Promise.resolve();
      })
      .then(function(mapped) {
        if (mapped)
          return mapped;

        var defaultJSExtension = loader.defaultJSExtensions && name.substr(name.length - 3, 3) != '.js';

        // apply map, core, paths, contextual package map
        var normalized = normalize.call(loader, name, parentName);

        // undo defaultJSExtension
        if (defaultJSExtension && normalized.substr(normalized.length - 3, 3) != '.js')
          defaultJSExtension = false;
        if (defaultJSExtension)
          normalized = normalized.substr(0, normalized.length - 3);

        var pkgConfigMatch = getPackageConfigMatch(loader, normalized);
        var pkgName = pkgConfigMatch && pkgConfigMatch.packageName || getPackage(loader, normalized);

        if (!pkgName)
          return Promise.resolve(normalized + (defaultJSExtension ? '.js' : ''));

        var pkg = loader.packages[pkgName];

        // if package is already configured or not a dynamic config package, use existing package config
        var isConfigured = pkg && (pkg.configured || !pkgConfigMatch);
        return (isConfigured ? Promise.resolve(pkg) : loadPackageConfigPath(loader, pkgName, pkgConfigMatch.configPath))
        .then(function(pkg) {
          var subPath = normalized.substr(pkgName.length + 1);

          return applyPackageConfig(loader, pkg, pkgName, subPath, isPlugin);
        });
      });
    };
  });

  // check if the given normalized name matches a packageConfigPath
  // if so, loads the config
  var packageConfigPaths = {};

  // data object for quick checks against package paths
  function createPkgConfigPathObj(path) {
    var lastWildcard = path.lastIndexOf('*');
    var length = Math.max(lastWildcard + 1, path.lastIndexOf('/'));
    return {
      length: length,
      regEx: new RegExp('^(' + path.substr(0, length).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^\\/]+') + ')(\\/|$)'),
      wildcard: lastWildcard != -1
    };
  }

  // most specific match wins
  function getPackageConfigMatch(loader, normalized) {
    var pkgName, exactMatch = false, configPath;
    for (var i = 0; i < loader.packageConfigPaths.length; i++) {
      var packageConfigPath = loader.packageConfigPaths[i];
      var p = packageConfigPaths[packageConfigPath] || (packageConfigPaths[packageConfigPath] = createPkgConfigPathObj(packageConfigPath));
      if (normalized.length < p.length)
        continue;
      var match = normalized.match(p.regEx);
      if (match && (!pkgName || (!(exactMatch && p.wildcard) && pkgName.length < match[1].length))) {
        pkgName = match[1];
        exactMatch = !p.wildcard;
        configPath = pkgName + packageConfigPath.substr(p.length);
      }
    }

    if (!pkgName)
      return;

    return {
      packageName: pkgName,
      configPath: configPath
    };
  }

  function loadPackageConfigPath(loader, pkgName, pkgConfigPath) {
    var configLoader = loader.pluginLoader || loader;

    // NB remove this when json is default
    (configLoader.meta[pkgConfigPath] = configLoader.meta[pkgConfigPath] || {}).format = 'json';
    configLoader.meta[pkgConfigPath].loader = null;

    return configLoader.load(pkgConfigPath)
    .then(function() {
      var cfg = configLoader.get(pkgConfigPath)['default'];

      // support "systemjs" prefixing
      if (cfg.systemjs)
        cfg = cfg.systemjs;

      // modules backwards compatibility
      if (cfg.modules) {
        cfg.meta = cfg.modules;
        warn.call(loader, 'Package config file ' + pkgConfigPath + ' is configured with "modules", which is deprecated as it has been renamed to "meta".');
      }

      // remove any non-system properties if generic config file (eg package.json)
      for (var p in cfg) {
        if (indexOf.call(packageProperties, p) == -1)
          delete cfg[p];
      }

      // deeply-merge (to first level) config with any existing package config
      var pkg = loader.packages[pkgName] = loader.packages[pkgName] || {};
      extendMeta(pkg, cfg, true);

      // support external depCache
      if (cfg.depCache) {
        for (var d in cfg.depCache) {
          var dNormalized;

          if (d.substr(0, 2) == './')
            dNormalized = pkgName + '/' + d.substr(2);
          else
            dNormalized = coreResolve.call(loader, d);
          loader.depCache[dNormalized] = (loader.depCache[dNormalized] || []).concat(cfg.depCache[d]);
        }
        delete cfg.depCache;
      }

      // main object becomes main map
      if (typeof pkg.main == 'object') {
        pkg.map = pkg.map || {};
        pkg.map['./@main'] = pkg.main;
        pkg.main['default'] = pkg.main['default'] || './';
        pkg.main = '@main';
      }

      return pkg;
    });
  }

  function getMetaMatches(pkgMeta, subPath, matchFn) {
    // wildcard meta
    var meta = {};
    var wildcardIndex;
    for (var module in pkgMeta) {
      // allow meta to start with ./ for flexibility
      var dotRel = module.substr(0, 2) == './' ? './' : '';
      if (dotRel)
        module = module.substr(2);

      wildcardIndex = module.indexOf('*');
      if (wildcardIndex === -1)
        continue;

      if (module.substr(0, wildcardIndex) == subPath.substr(0, wildcardIndex)
          && module.substr(wildcardIndex + 1) == subPath.substr(subPath.length - module.length + wildcardIndex + 1)) {
        // alow match function to return true for an exit path
        if (matchFn(module, pkgMeta[dotRel + module], module.split('/').length))
          return;
      }
    }
    // exact meta
    var exactMeta = pkgMeta[subPath] && pkgMeta.hasOwnProperty && pkgMeta.hasOwnProperty(subPath) ? pkgMeta[subPath] : pkgMeta['./' + subPath];
    if (exactMeta)
      matchFn(exactMeta, exactMeta, 0);
  }

  hook('locate', function(locate) {
    return function(load) {
      var loader = this;
      return Promise.resolve(locate.call(this, load))
      .then(function(address) {
        var pkgName = getPackage(loader, load.name);
        if (pkgName) {
          var pkg = loader.packages[pkgName];
          var subPath = load.name.substr(pkgName.length + 1);

          // format
          if (pkg.format)
            load.metadata.format = load.metadata.format || pkg.format;

          var meta = {};
          if (pkg.meta) {
            var bestDepth = 0;

            // NB support a main shorthand in meta here?
            getMetaMatches(pkg.meta, subPath, function(metaPattern, matchMeta, matchDepth) {
              if (matchDepth > bestDepth)
                bestDepth = matchDepth;
              extendMeta(meta, matchMeta, matchDepth && bestDepth > matchDepth);
            });

            extendMeta(load.metadata, meta);
          }
        }

        return address;
      });
    };
  });

})();
/*
 * Script tag fetch
 *
 * When load.metadata.scriptLoad is true, we load via script tag injection.
 */
(function() {

  if (typeof document != 'undefined')
    var head = document.getElementsByTagName('head')[0];

  var curSystem;
  var curRequire;

  // if doing worker executing, this is set to the load record being executed
  var workerLoad = null;
  
  // interactive mode handling method courtesy RequireJS
  var ieEvents = head && (function() {
    var s = document.createElement('script');
    var isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]';
    return s.attachEvent && !(s.attachEvent.toString && s.attachEvent.toString().indexOf('[native code') < 0) && !isOpera;
  })();

  // IE interactive-only part
  // we store loading scripts array as { script: <script>, load: {...} }
  var interactiveLoadingScripts = [];
  var interactiveScript;
  function getInteractiveScriptLoad() {
    if (interactiveScript && interactiveScript.script.readyState === 'interactive')
      return interactiveScript.load;

    for (var i = 0; i < interactiveLoadingScripts.length; i++)
      if (interactiveLoadingScripts[i].script.readyState == 'interactive') {
        interactiveScript = interactiveLoadingScripts[i];
        return interactiveScript.load;
      }
  }
  
  // System.register, System.registerDynamic, AMD define pipeline
  // this is called by the above methods when they execute
  // we then run the reduceRegister_ collection function either immediately
  // if we are in IE and know the currently executing script (interactive)
  // or later if we need to wait for the synchronous load callback to know the script
  var loadingCnt = 0;
  var registerQueue = [];
  hook('pushRegister_', function(pushRegister) {
    return function(register) {
      // if using eval-execution then skip
      if (pushRegister.call(this, register))
        return false;

      // if using worker execution, then we're done
      if (workerLoad)
        this.reduceRegister_(workerLoad, register);

      // detect if we know the currently executing load (IE)
      // if so, immediately call reduceRegister
      else if (ieEvents)
        this.reduceRegister_(getInteractiveScriptLoad(), register);

      // otherwise, add to our execution queue
      // to call reduceRegister on sync script load event
      else if (loadingCnt)
        registerQueue.push(register);

      // if we're not currently loading anything though
      // then do the reduction against a null load
      // (out of band named define or named register)
      // note even in non-script environments, this catch is used
      else
        this.reduceRegister_(null, register);

      return true;
    };
  });

  function webWorkerImport(loader, load) {
    return new Promise(function(resolve, reject) {
      if (load.metadata.integrity)
        reject(new Error('Subresource integrity checking is not supported in web workers.'));

      workerLoad = load;
      try {
        importScripts(load.address);
      }
      catch(e) {
        workerLoad = null;
        reject(e);
      }
      workerLoad = null;

      // if nothing registered, then something went wrong
      if (!load.metadata.entry)
        reject(new Error(load.address + ' did not call System.register or AMD define'));

      resolve('');
    });
  }

  // override fetch to use script injection
  hook('fetch', function(fetch) {
    return function(load) {
      var loader = this;

      if (load.metadata.format == 'json' || !load.metadata.scriptLoad || (!isBrowser && !isWorker))
        return fetch.call(this, load);

      if (isWorker)
        return webWorkerImport(loader, load);

      return new Promise(function(resolve, reject) {
        var s = document.createElement('script');
        
        s.async = true;

        if (load.metadata.crossOrigin)
          s.crossOrigin = load.metadata.crossOrigin;

        if (load.metadata.integrity)
          s.setAttribute('integrity', load.metadata.integrity);

        if (ieEvents) {
          s.attachEvent('onreadystatechange', complete);
          interactiveLoadingScripts.push({
            script: s,
            load: load
          });
        }
        else {
          s.addEventListener('load', complete, false);
          s.addEventListener('error', error, false);
        }

        loadingCnt++;

        curSystem = __global.System;
        curRequire = __global.require;

        s.src = load.address;
        head.appendChild(s);

        function complete(evt) {
          if (s.readyState && s.readyState != 'loaded' && s.readyState != 'complete')
            return;

          loadingCnt--;

          // complete call is sync on execution finish
          // (in ie already done reductions)
          if (!load.metadata.entry && !registerQueue.length) {
            loader.reduceRegister_(load);
          }
          else if (!ieEvents) {
            for (var i = 0; i < registerQueue.length; i++)
              loader.reduceRegister_(load, registerQueue[i]);
            registerQueue = [];
          }

          cleanup();

          // if nothing registered, then something went wrong
          if (!load.metadata.entry && !load.metadata.bundle)
            reject(new Error(load.name + ' did not call System.register or AMD define. If loading a global module configure the global name via the meta exports property for script injection support.'));

          resolve('');
        }

        function error(evt) {
          cleanup();
          reject(new Error('Unable to load script ' + load.address));
        }

        function cleanup() {
          __global.System = curSystem;
          __global.require = curRequire;

          if (s.detachEvent) {
            s.detachEvent('onreadystatechange', complete);
            for (var i = 0; i < interactiveLoadingScripts.length; i++)
              if (interactiveLoadingScripts[i].script == s) {
                if (interactiveScript && interactiveScript.script == s)
                  interactiveScript = null;
                interactiveLoadingScripts.splice(i, 1);
              }
          }
          else {
            s.removeEventListener('load', complete, false);
            s.removeEventListener('error', error, false);
          }

          head.removeChild(s);
        }
      });
    };
  });
})();
/*
 * Instantiate registry extension
 *
 * Supports Traceur System.register 'instantiate' output for loading ES6 as ES5.
 *
 * - Creates the loader.register function
 * - Also supports metadata.format = 'register' in instantiate for anonymous register modules
 * - Also supports metadata.deps, metadata.execute and metadata.executingRequire
 *     for handling dynamic modules alongside register-transformed ES6 modules
 *
 *
 * The code here replicates the ES6 linking groups algorithm to ensure that
 * circular ES6 compiled into System.register can work alongside circular AMD 
 * and CommonJS, identically to the actual ES6 loader.
 *
 */


/*
 * Registry side table entries in loader.defined
 * Registry Entry Contains:
 *    - name
 *    - deps 
 *    - declare for declarative modules
 *    - execute for dynamic modules, different to declarative execute on module
 *    - executingRequire indicates require drives execution for circularity of dynamic modules
 *    - declarative optional boolean indicating which of the above
 *
 * Can preload modules directly on SystemJS.defined['my/module'] = { deps, execute, executingRequire }
 *
 * Then the entry gets populated with derived information during processing:
 *    - normalizedDeps derived from deps, created in instantiate
 *    - groupIndex used by group linking algorithm
 *    - evaluated indicating whether evaluation has happend
 *    - module the module record object, containing:
 *      - exports actual module exports
 *
 *    For dynamic we track the es module with:
 *    - esModule actual es module value
 *    - esmExports whether to extend the esModule with named exports
 *      
 *    Then for declarative only we track dynamic bindings with the 'module' records:
 *      - name
 *      - exports
 *      - setters declarative setter functions
 *      - dependencies, module records of dependencies
 *      - importers, module records of dependents
 *
 * After linked and evaluated, entries are removed, declarative module records remain in separate
 * module binding table
 *
 */

var leadingCommentAndMetaRegEx = /^(\s*\/\*[^\*]*(\*(?!\/)[^\*]*)*\*\/|\s*\/\/[^\n]*|\s*"[^"]+"\s*;?|\s*'[^']+'\s*;?)*\s*/;
function detectRegisterFormat(source) {
  var leadingCommentAndMeta = source.match(leadingCommentAndMetaRegEx);
  return leadingCommentAndMeta && source.substr(leadingCommentAndMeta[0].length, 15) == 'System.register';
}

function createEntry() {
  return {
    name: null,
    deps: null,
    originalIndices: null,
    declare: null,
    execute: null,
    executingRequire: false,
    declarative: false,
    normalizedDeps: null,
    groupIndex: null,
    evaluated: false,
    module: null,
    esModule: null,
    esmExports: false
  };
}

(function() {

  /*
   * There are two variations of System.register:
   * 1. System.register for ES6 conversion (2-3 params) - System.register([name, ]deps, declare)
   *    see https://github.com/ModuleLoader/es6-module-loader/wiki/System.register-Explained
   *
   * 2. System.registerDynamic for dynamic modules (3-4 params) - System.registerDynamic([name, ]deps, executingRequire, execute)
   * the true or false statement 
   *
   * this extension implements the linking algorithm for the two variations identical to the spec
   * allowing compiled ES6 circular references to work alongside AMD and CJS circular references.
   *
   */
  SystemJSLoader.prototype.register = function(name, deps, declare) {
    if (typeof name != 'string') {
      declare = deps;
      deps = name;
      name = null;
    }

    // dynamic backwards-compatibility
    // can be deprecated eventually
    if (typeof declare == 'boolean')
      return this.registerDynamic.apply(this, arguments);

    var entry = createEntry();
    // ideally wouldn't apply map config to bundle names but 
    // dependencies go through map regardless so we can't restrict
    // could reconsider in shift to new spec
    entry.name = name && (this.decanonicalize || this.normalize).call(this, name);
    entry.declarative = true;
    entry.deps = deps;
    entry.declare = declare;

    this.pushRegister_({
      amd: false,
      entry: entry
    });
  };
  SystemJSLoader.prototype.registerDynamic = function(name, deps, declare, execute) {
    if (typeof name != 'string') {
      execute = declare;
      declare = deps;
      deps = name;
      name = null;
    }

    // dynamic
    var entry = createEntry();
    entry.name = name && (this.decanonicalize || this.normalize).call(this, name);
    entry.deps = deps;
    entry.execute = execute;
    entry.executingRequire = declare;

    this.pushRegister_({
      amd: false,
      entry: entry
    });
  };
  hook('reduceRegister_', function() {
    return function(load, register) {
      if (!register)
        return;

      var entry = register.entry;
      var curMeta = load && load.metadata;

      // named register
      if (entry.name) {
        if (!(entry.name in this.defined))
          this.defined[entry.name] = entry;

        if (curMeta)
          curMeta.bundle = true;
      }
      // anonymous register
      if (!entry.name || load && entry.name == load.name) {
        if (!curMeta)
          throw new TypeError('Invalid System.register call. Anonymous System.register calls can only be made by modules loaded by SystemJS.import and not via script tags.');
        if (curMeta.entry) {
          if (curMeta.format == 'register')
            throw new Error('Multiple anonymous System.register calls in module ' + load.name + '. If loading a bundle, ensure all the System.register calls are named.');
          else
            throw new Error('Module ' + load.name + ' interpreted as ' + curMeta.format + ' module format, but called System.register.');
        }
        if (!curMeta.format)
          curMeta.format = 'register';
        curMeta.entry = entry;
      }
    };
  });

  hookConstructor(function(constructor) {
    return function() {
      constructor.call(this);

      this.defined = {};
      this._loader.moduleRecords = {};
    };
  });

  function buildGroups(entry, loader, groups) {
    groups[entry.groupIndex] = groups[entry.groupIndex] || [];

    if (indexOf.call(groups[entry.groupIndex], entry) != -1)
      return;

    groups[entry.groupIndex].push(entry);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = loader.defined[depName];
      
      // not in the registry means already linked / ES6
      if (!depEntry || depEntry.evaluated)
        continue;
      
      // now we know the entry is in our unlinked linkage group
      var depGroupIndex = entry.groupIndex + (depEntry.declarative != entry.declarative);

      // the group index of an entry is always the maximum
      if (depEntry.groupIndex === null || depEntry.groupIndex < depGroupIndex) {
        
        // if already in a group, remove from the old group
        if (depEntry.groupIndex !== null) {
          groups[depEntry.groupIndex].splice(indexOf.call(groups[depEntry.groupIndex], depEntry), 1);

          // if the old group is empty, then we have a mixed depndency cycle
          if (groups[depEntry.groupIndex].length == 0)
            throw new Error("Mixed dependency cycle detected");
        }

        depEntry.groupIndex = depGroupIndex;
      }

      buildGroups(depEntry, loader, groups);
    }
  }

  function link(name, loader) {
    var startEntry = loader.defined[name];

    // skip if already linked
    if (startEntry.module)
      return;

    startEntry.groupIndex = 0;

    var groups = [];

    buildGroups(startEntry, loader, groups);

    var curGroupDeclarative = !!startEntry.declarative == groups.length % 2;
    for (var i = groups.length - 1; i >= 0; i--) {
      var group = groups[i];
      for (var j = 0; j < group.length; j++) {
        var entry = group[j];

        // link each group
        if (curGroupDeclarative)
          linkDeclarativeModule(entry, loader);
        else
          linkDynamicModule(entry, loader);
      }
      curGroupDeclarative = !curGroupDeclarative; 
    }
  }

  // module binding records
  function ModuleRecord() {}
  defineProperty(ModuleRecord, 'toString', {
    value: function() {
      return 'Module';
    }
  });

  function getOrCreateModuleRecord(name, moduleRecords) {
    return moduleRecords[name] || (moduleRecords[name] = {
      name: name,
      dependencies: [],
      exports: new ModuleRecord(), // start from an empty module and extend
      importers: []
    });
  }

  function linkDeclarativeModule(entry, loader) {
    // only link if already not already started linking (stops at circular)
    if (entry.module)
      return;

    var moduleRecords = loader._loader.moduleRecords;
    var module = entry.module = getOrCreateModuleRecord(entry.name, moduleRecords);
    var exports = entry.module.exports;

    var declaration = entry.declare.call(__global, function(name, value) {
      module.locked = true;

      if (typeof name == 'object') {
        for (var p in name)
          exports[p] = name[p];
      }
      else {
        exports[name] = value;
      }

      for (var i = 0, l = module.importers.length; i < l; i++) {
        var importerModule = module.importers[i];
        if (!importerModule.locked) {
          var importerIndex = indexOf.call(importerModule.dependencies, module);
          importerModule.setters[importerIndex](exports);
        }
      }

      module.locked = false;
      return value;
    }, { id: entry.name });
    
    module.setters = declaration.setters;
    module.execute = declaration.execute;

    if (!module.setters || !module.execute) {
      throw new TypeError('Invalid System.register form for ' + entry.name);
    }

    // now link all the module dependencies
    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      var depEntry = loader.defined[depName];
      var depModule = moduleRecords[depName];

      // work out how to set depExports based on scenarios...
      var depExports;

      if (depModule) {
        depExports = depModule.exports;
      }
      // dynamic, already linked in our registry
      else if (depEntry && !depEntry.declarative) {
        depExports = depEntry.esModule;
      }
      // in the loader registry
      else if (!depEntry) {
        depExports = loader.get(depName);
      }
      // we have an entry -> link
      else {
        linkDeclarativeModule(depEntry, loader);
        depModule = depEntry.module;
        depExports = depModule.exports;
      }

      // only declarative modules have dynamic bindings
      if (depModule && depModule.importers) {
        depModule.importers.push(module);
        module.dependencies.push(depModule);
      }
      else {
        module.dependencies.push(null);
      }
      
      // run setters for all entries with the matching dependency name
      var originalIndices = entry.originalIndices[i];
      for (var j = 0, len = originalIndices.length; j < len; ++j) {
        var index = originalIndices[j];
        if (module.setters[index]) {
          module.setters[index](depExports);
        }
      }
    }
  }

  // An analog to loader.get covering execution of all three layers (real declarative, simulated declarative, simulated dynamic)
  function getModule(name, loader) {
    var exports;
    var entry = loader.defined[name];

    if (!entry) {
      exports = loader.get(name);
      if (!exports)
        throw new Error('Unable to load dependency ' + name + '.');
    }

    else {
      if (entry.declarative)
        ensureEvaluated(name, [], loader);
    
      else if (!entry.evaluated)
        linkDynamicModule(entry, loader);

      exports = entry.module.exports;
    }

    if ((!entry || entry.declarative) && exports && exports.__useDefault)
      return exports['default'];
    
    return exports;
  }

  function linkDynamicModule(entry, loader) {
    if (entry.module)
      return;

    var exports = {};

    var module = entry.module = { exports: exports, id: entry.name };

    // AMD requires execute the tree first
    if (!entry.executingRequire) {
      for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
        var depName = entry.normalizedDeps[i];
        // we know we only need to link dynamic due to linking algorithm
        var depEntry = loader.defined[depName];
        if (depEntry)
          linkDynamicModule(depEntry, loader);
      }
    }

    // now execute
    entry.evaluated = true;
    var output = entry.execute.call(__global, function(name) {
      for (var i = 0, l = entry.deps.length; i < l; i++) {
        if (entry.deps[i] != name)
          continue;
        return getModule(entry.normalizedDeps[i], loader);
      }
      // try and normalize the dependency to see if we have another form
      var nameNormalized = loader.normalizeSync(name, entry.name);
      if (indexOf.call(entry.normalizedDeps, nameNormalized) != -1)
        return getModule(nameNormalized, loader);

      throw new Error('Module ' + name + ' not declared as a dependency of ' + entry.name);
    }, exports, module);
    
    if (output)
      module.exports = output;

    // create the esModule object, which allows ES6 named imports of dynamics
    exports = module.exports;

    // __esModule flag treats as already-named
    if (exports && (exports.__esModule || exports instanceof Module))
      entry.esModule = exports;
    // set module as 'default' export, then fake named exports by iterating properties
    else if (entry.esmExports && exports !== __global)
      entry.esModule = getESModule(exports);
    // just use the 'default' export
    else
      entry.esModule = { 'default': exports };
  }

  /*
   * Given a module, and the list of modules for this current branch,
   *  ensure that each of the dependencies of this module is evaluated
   *  (unless one is a circular dependency already in the list of seen
   *  modules, in which case we execute it)
   *
   * Then we evaluate the module itself depth-first left to right 
   * execution to match ES6 modules
   */
  function ensureEvaluated(moduleName, seen, loader) {
    var entry = loader.defined[moduleName];

    // if already seen, that means it's an already-evaluated non circular dependency
    if (!entry || entry.evaluated || !entry.declarative)
      return;

    // this only applies to declarative modules which late-execute

    seen.push(moduleName);

    for (var i = 0, l = entry.normalizedDeps.length; i < l; i++) {
      var depName = entry.normalizedDeps[i];
      if (indexOf.call(seen, depName) == -1) {
        if (!loader.defined[depName])
          loader.get(depName);
        else
          ensureEvaluated(depName, seen, loader);
      }
    }

    if (entry.evaluated)
      return;

    entry.evaluated = true;
    entry.module.execute.call(__global);
  }

  // override the delete method to also clear the register caches
  hook('delete', function(del) {
    return function(name) {
      delete this._loader.moduleRecords[name];
      delete this.defined[name];
      return del.call(this, name);
    };
  });

  hook('fetch', function(fetch) {
    return function(load) {
      if (this.defined[load.name]) {
        load.metadata.format = 'defined';
        return '';
      }

      load.metadata.deps = load.metadata.deps || [];
      
      return fetch.call(this, load);
    };
  });

  hook('translate', function(translate) {
    // we run the meta detection here (register is after meta)
    return function(load) {
      load.metadata.deps = load.metadata.deps || [];
      return Promise.resolve(translate.call(this, load)).then(function(source) {
        // run detection for register format
        if (load.metadata.format == 'register' || !load.metadata.format && detectRegisterFormat(load.source))
          load.metadata.format = 'register';
        return source;
      });
    };
  });

  hook('instantiate', function(instantiate) {
    return function(load) {
      if (load.metadata.format == 'detect')
        load.metadata.format = undefined;

      // assumes previous instantiate is sync
      // (core json support)
      instantiate.call(this, load);

      var loader = this;

      var entry;

      // first we check if this module has already been defined in the registry
      if (loader.defined[load.name]) {
        entry = loader.defined[load.name];
        // don't support deps for ES modules
        if (!entry.declarative)
          entry.deps = entry.deps.concat(load.metadata.deps);
      }

      // picked up already by an anonymous System.register script injection
      // or via the dynamic formats
      else if (load.metadata.entry) {
        entry = load.metadata.entry;
        entry.deps = entry.deps.concat(load.metadata.deps);
      }

      // Contains System.register calls
      // (dont run bundles in the builder)
      else if (!(loader.builder && load.metadata.bundle) 
          && (load.metadata.format == 'register' || load.metadata.format == 'esm' || load.metadata.format == 'es6')) {
        
        if (typeof __exec != 'undefined')
          __exec.call(loader, load);

        if (!load.metadata.entry && !load.metadata.bundle)
          throw new Error(load.name + ' detected as ' + load.metadata.format + ' but didn\'t execute.');

        entry = load.metadata.entry;

        // support metadata deps for System.register
        if (entry && load.metadata.deps)
          entry.deps = entry.deps.concat(load.metadata.deps);
      }

      // named bundles are just an empty module
      if (!entry) {
        entry = createEntry();
        entry.deps = load.metadata.deps;
        entry.execute = function() {};
      }

      // place this module onto defined for circular references
      loader.defined[load.name] = entry;
      
      var grouped = group(entry.deps);
      
      entry.deps = grouped.names;
      entry.originalIndices = grouped.indices;
      entry.name = load.name;
      entry.esmExports = load.metadata.esmExports !== false;

      // first, normalize all dependencies
      var normalizePromises = [];
      for (var i = 0, l = entry.deps.length; i < l; i++)
        normalizePromises.push(Promise.resolve(loader.normalize(entry.deps[i], load.name)));

      return Promise.all(normalizePromises).then(function(normalizedDeps) {

        entry.normalizedDeps = normalizedDeps;

        return {
          deps: entry.deps,
          execute: function() {
            // recursively ensure that the module and all its 
            // dependencies are linked (with dependency group handling)
            link(load.name, loader);

            // now handle dependency execution in correct order
            ensureEvaluated(load.name, [], loader);

            // remove from the registry
            loader.defined[load.name] = undefined;

            // return the defined module object
            return loader.newModule(entry.declarative ? entry.module.exports : entry.esModule);
          }
        };
      });
    };
  });
})();
/*
 * Extension to detect ES6 and auto-load Traceur or Babel for processing
 */
(function() {
  // good enough ES6 module detection regex - format detections not designed to be accurate, but to handle the 99% use case
  var esmRegEx = /(^\s*|[}\);\n]\s*)(import\s*(['"]|(\*\s+as\s+)?[^"'\(\)\n;]+\s*from\s*['"]|\{)|export\s+\*\s+from\s+["']|export\s*(\{|default|function|class|var|const|let|async\s+function))/;

  var traceurRuntimeRegEx = /\$traceurRuntime\s*\./;
  var babelHelpersRegEx = /babelHelpers\s*\./;

  hook('translate', function(translate) {
    return function(load) {
      var loader = this;
      return translate.call(loader, load)
      .then(function(source) {
        // detect & transpile ES6
        if (load.metadata.format == 'esm' || load.metadata.format == 'es6' || !load.metadata.format && source.match(esmRegEx)) {
          if (load.metadata.format == 'es6')
            warn.call(loader, 'Module ' + load.name + ' has metadata setting its format to "es6", which is deprecated.\nThis should be updated to "esm".');

          load.metadata.format = 'esm';

          if (loader.transpiler === false) {
            // we accept translation to esm for builds though to enable eg rollup optimizations
            if (loader.builder)
              return source;
            throw new TypeError('Unable to dynamically transpile ES module as SystemJS.transpiler set to false.');
          }

          // setting _loader.loadedTranspiler = false tells the next block to
          // do checks for setting transpiler metadata
          loader._loader.loadedTranspiler = loader._loader.loadedTranspiler || false;
          if (loader.pluginLoader)
            loader.pluginLoader._loader.loadedTranspiler = loader._loader.loadedTranspiler || false;

          // do transpilation
          return (loader._loader.transpilerPromise || (
            loader._loader.transpilerPromise = Promise.resolve(
              __global[loader.transpiler == 'typescript' ? 'ts' : loader.transpiler] || (loader.pluginLoader || loader)['import'](loader.transpiler)
          ))).then(function(transpiler) {
            loader._loader.loadedTranspilerRuntime = true;

            // translate hooks means this is a transpiler plugin instead of a raw implementation
            if (transpiler.translate) {
              // if transpiler is the same as the plugin loader, then don't run twice
              if (transpiler == load.metadata.loaderModule)
                return load.source;

              // convert the source map into an object for transpilation chaining
              if (typeof load.metadata.sourceMap == 'string')
                load.metadata.sourceMap = JSON.parse(load.metadata.sourceMap);

              return Promise.resolve(transpiler.translate.call(loader, load))
              .then(function(source) {
                // sanitize sourceMap if an object not a JSON string
                var sourceMap = load.metadata.sourceMap;
                if (sourceMap && typeof sourceMap == 'object') {
                  var originalName = load.name.split('!')[0];
                  
                  // force set the filename of the original file
                  sourceMap.file = originalName + '!transpiled';

                  // force set the sources list if only one source
                  if (!sourceMap.sources || sourceMap.sources.length <= 1)
                    sourceMap.sources = [originalName];
                }

                if (load.metadata.format == 'esm' && !loader.builder && detectRegisterFormat(source))
                  load.metadata.format = 'register';
                return source;
              });
            }

            // legacy builder support
            if (loader.builder)
              load.metadata.originalSource = load.source;
            
            // defined in es6-module-loader/src/transpile.js
            return transpile.call(loader, load)
            .then(function(source) {
              // clear sourceMap as transpiler embeds it
              load.metadata.sourceMap = undefined;
              return source;
            });            
          });
        }

        // skip transpiler and transpiler runtime loading when transpiler is disabled
        if (loader.transpiler === false)
          return source;

        // load the transpiler correctly
        if (loader._loader.loadedTranspiler === false && (loader.transpiler == 'traceur' || loader.transpiler == 'typescript' || loader.transpiler == 'babel')
            && load.name == loader.normalizeSync(loader.transpiler)) {

          // always load transpiler as a global
          if (source.length > 100 && !load.metadata.format) {
            load.metadata.format = 'global';

            if (loader.transpiler === 'traceur')
              load.metadata.exports = 'traceur';
            if (loader.transpiler === 'typescript')
              load.metadata.exports = 'ts';
          }

          loader._loader.loadedTranspiler = true;
        }

        // load the transpiler runtime correctly
        if (loader._loader.loadedTranspilerRuntime === false) {
          if (load.name == loader.normalizeSync('traceur-runtime')
              || load.name == loader.normalizeSync('babel/external-helpers*')) {
            if (source.length > 100)
              load.metadata.format = load.metadata.format || 'global';

            loader._loader.loadedTranspilerRuntime = true;
          }
        }

        // detect transpiler runtime usage to load runtimes
        if ((load.metadata.format == 'register' || load.metadata.bundle) && loader._loader.loadedTranspilerRuntime !== true) {
          if (!__global.$traceurRuntime && load.source.match(traceurRuntimeRegEx)) {
            loader._loader.loadedTranspilerRuntime = loader._loader.loadedTranspilerRuntime || false;
            return loader['import']('traceur-runtime').then(function() {
              return source;
            });
          }
          if (!__global.babelHelpers && load.source.match(babelHelpersRegEx)) {
            loader._loader.loadedTranspilerRuntime = loader._loader.loadedTranspilerRuntime || false;
            return loader['import']('babel/external-helpers').then(function() {
              return source;
            });
          }
        }

        return source;
      });
    };
  });

})();
/*
  SystemJS Global Format

  Supports
    metadata.deps
    metadata.globals
    metadata.exports

  Without metadata.exports, detects writes to the global object.
*/
var __globalName = typeof self != 'undefined' ? 'self' : 'global';

hook('fetch', function(fetch) {
  return function(load) {
    if (load.metadata.exports && !load.metadata.format)
      load.metadata.format = 'global';
    return fetch.call(this, load);
  };
});

// ideally we could support script loading for globals, but the issue with that is that
// we can't do it with AMD support side-by-side since AMD support means defining the
// global define, and global support means not definining it, yet we don't have any hook
// into the "pre-execution" phase of a script tag being loaded to handle both cases
hook('instantiate', function(instantiate) {
  return function(load) {
    var loader = this;

    if (!load.metadata.format)
      load.metadata.format = 'global';

    // global is a fallback module format
    if (load.metadata.format == 'global' && !load.metadata.registered) {

      var entry = createEntry();

      load.metadata.entry = entry;

      entry.deps = [];

      for (var g in load.metadata.globals) {
        var gl = load.metadata.globals[g];
        if (gl)
          entry.deps.push(gl);
      }

      entry.execute = function(require, exports, module) {

        var globals;
        if (load.metadata.globals) {
          globals = {};
          for (var g in load.metadata.globals)
            if (load.metadata.globals[g])
              globals[g] = require(load.metadata.globals[g]);
        }
        
        var exportName = load.metadata.exports;

        if (exportName)
          load.source += '\n' + __globalName + '["' + exportName + '"] = ' + exportName + ';';

        var retrieveGlobal = loader.get('@@global-helpers').prepareGlobal(module.id, exportName, globals);

        __exec.call(loader, load);

        return retrieveGlobal();
      }
    }
    return instantiate.call(this, load);
  };
});


function getGlobalValue(exports) {
  if (typeof exports == 'string')
    return readMemberExpression(exports, __global);

  if (!(exports instanceof Array))
    throw new Error('Global exports must be a string or array.');

  var globalValue = {};
  var first = true;
  for (var i = 0; i < exports.length; i++) {
    var val = readMemberExpression(exports[i], __global);
    if (first) {
      globalValue['default'] = val;
      first = false;
    }
    globalValue[exports[i].split('.').pop()] = val;
  }
  return globalValue;
}

hook('reduceRegister_', function(reduceRegister) {
  return function(load, register) {
    if (register || !load.metadata.exports)
      return reduceRegister.call(this, load, register);

    load.metadata.format = 'global';
    var entry = load.metadata.entry = createEntry();
    entry.deps = load.metadata.deps;
    var globalValue = getGlobalValue(load.metadata.exports);
    entry.execute = function() {
      return globalValue;
    };
  };
});

hookConstructor(function(constructor) {
  return function() {
    var loader = this;
    constructor.call(loader);

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    // bare minimum ignores
    var ignoredGlobalProps = ['_g', 'sessionStorage', 'localStorage', 'clipboardData', 'frames', 'frameElement', 'external', 
      'mozAnimationStartTime', 'webkitStorageInfo', 'webkitIndexedDB', 'mozInnerScreenY', 'mozInnerScreenX'];

    var globalSnapshot;

    function forEachGlobal(callback) {
      if (Object.keys)
        Object.keys(__global).forEach(callback);
      else
        for (var g in __global) {
          if (!hasOwnProperty.call(__global, g))
            continue;
          callback(g);
        }
    }

    function forEachGlobalValue(callback) {
      forEachGlobal(function(globalName) {
        if (indexOf.call(ignoredGlobalProps, globalName) != -1)
          return;
        try {
          var value = __global[globalName];
        }
        catch (e) {
          ignoredGlobalProps.push(globalName);
        }
        callback(globalName, value);
      });
    }

    loader.set('@@global-helpers', loader.newModule({
      prepareGlobal: function(moduleName, exports, globals) {
        // disable module detection
        var curDefine = __global.define;
        
        __global.define = undefined;

        // set globals
        var oldGlobals;
        if (globals) {
          oldGlobals = {};
          for (var g in globals) {
            oldGlobals[g] = __global[g];
            __global[g] = globals[g];
          }
        }

        // store a complete copy of the global object in order to detect changes
        if (!exports) {
          globalSnapshot = {};

          forEachGlobalValue(function(name, value) {
            globalSnapshot[name] = value;
          });
        }

        // return function to retrieve global
        return function() {
          var globalValue;

          if (exports) {
            globalValue = getGlobalValue(exports);
          }
          else {
            globalValue = {};
            var singleGlobal;
            var multipleExports;

            forEachGlobalValue(function(name, value) {
              if (globalSnapshot[name] === value)
                return;
              if (typeof value == 'undefined')
                return;
              globalValue[name] = value;

              if (typeof singleGlobal != 'undefined') {
                if (!multipleExports && singleGlobal !== value)
                  multipleExports = true;
              }
              else {
                singleGlobal = value;
              }
            });
            globalValue = multipleExports ? globalValue : singleGlobal;
          }

          // revert globals
          if (oldGlobals) {
            for (var g in oldGlobals)
              __global[g] = oldGlobals[g];
          }
          __global.define = curDefine;

          return globalValue;
        };
      }
    }));
  };
});
/*
  SystemJS CommonJS Format
*/
(function() {
  // CJS Module Format
  // require('...') || exports[''] = ... || exports.asd = ... || module.exports = ...
  var cjsExportsRegEx = /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF.])(exports\s*(\[['"]|\.)|module(\.exports|\['exports'\]|\["exports"\])\s*(\[['"]|[=,\.]))/;
  // RegEx adjusted from https://github.com/jbrantly/yabble/blob/master/lib/yabble.js#L339
  var cjsRequireRegEx = /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF."'])require\s*\(\s*("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')\s*\)/g;
  var commentRegEx = /(^|[^\\])(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;

  var stringRegEx = /("[^"\\\n\r]*(\\.[^"\\\n\r]*)*"|'[^'\\\n\r]*(\\.[^'\\\n\r]*)*')/g;

  // used to support leading #!/usr/bin/env in scripts as supported in Node
  var hashBangRegEx = /^\#\!.*/;

  function getCJSDeps(source) {
    cjsRequireRegEx.lastIndex = commentRegEx.lastIndex = stringRegEx.lastIndex = 0;

    var deps = [];

    var match;

    // track string and comment locations for unminified source    
    var stringLocations = [], commentLocations = [];

    function inLocation(locations, match) {
      for (var i = 0; i < locations.length; i++)
        if (locations[i][0] < match.index && locations[i][1] > match.index)
          return true;
      return false;
    }

    if (source.length / source.split('\n').length < 200) {
      while (match = stringRegEx.exec(source))
        stringLocations.push([match.index, match.index + match[0].length]);
      
      while (match = commentRegEx.exec(source)) {
        // only track comments not starting in strings
        if (!inLocation(stringLocations, match))
          commentLocations.push([match.index, match.index + match[0].length]);
      }
    }

    while (match = cjsRequireRegEx.exec(source)) {
      // ensure we're not within a string or comment location
      if (!inLocation(stringLocations, match) && !inLocation(commentLocations, match)) {
        var dep = match[1].substr(1, match[1].length - 2);
        // skip cases like require('" + file + "')
        if (dep.match(/"|'/))
          continue;
        // trailing slash requires are removed as they don't map mains in SystemJS
        if (dep[dep.length - 1] == '/')
          dep = dep.substr(0, dep.length - 1);
        deps.push(dep);
      }
    }

    return deps;
  }

  hook('instantiate', function(instantiate) {
    return function(load) {
      var loader = this;
      if (!load.metadata.format) {
        cjsExportsRegEx.lastIndex = 0;
        cjsRequireRegEx.lastIndex = 0;
        if (cjsRequireRegEx.exec(load.source) || cjsExportsRegEx.exec(load.source))
          load.metadata.format = 'cjs';
      }

      if (load.metadata.format == 'cjs') {
        var metaDeps = load.metadata.deps;
        var deps = load.metadata.cjsRequireDetection === false ? [] : getCJSDeps(load.source);

        for (var g in load.metadata.globals)
          if (load.metadata.globals[g])
            deps.push(load.metadata.globals[g]);

        var entry = createEntry();

        load.metadata.entry = entry;

        entry.deps = deps;
        entry.executingRequire = true;
        entry.execute = function(_require, exports, module) {
          function require(name) {
            if (name[name.length - 1] == '/')
              name = name.substr(0, name.length - 1);
            return _require.apply(this, arguments);
          }
          require.resolve = function(name) {
            return loader.get('@@cjs-helpers').requireResolve(name, module.id);
          };

          // ensure meta deps execute first
          if (!load.metadata.cjsDeferDepsExecute)
            for (var i = 0; i < metaDeps.length; i++)
              require(metaDeps[i]);

          var pathVars = loader.get('@@cjs-helpers').getPathVars(module.id);
          var __cjsWrapper = {
            exports: exports,
            args: [require, exports, module, pathVars.filename, pathVars.dirname, __global, __global]
          };

          var cjsWrapper = "(function(require, exports, module, __filename, __dirname, global, GLOBAL";

          // add metadata.globals to the wrapper arguments
          if (load.metadata.globals)
            for (var g in load.metadata.globals) {
              __cjsWrapper.args.push(require(load.metadata.globals[g]));
              cjsWrapper += ", " + g;
            }

          // disable AMD detection
          var define = __global.define;
          __global.define = undefined;
          __global.__cjsWrapper = __cjsWrapper;

          load.source = cjsWrapper + ") {" + load.source.replace(hashBangRegEx, '') + "\n}).apply(__cjsWrapper.exports, __cjsWrapper.args);";

          __exec.call(loader, load);

          __global.__cjsWrapper = undefined;
          __global.define = define;
        };
      }

      return instantiate.call(loader, load);
    };
  });
})();
hookConstructor(function(constructor) {
  return function() {
    var loader = this;
    constructor.call(loader);

    if (typeof window != 'undefined' && typeof document != 'undefined' && window.location)
      var windowOrigin = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');

    function stripOrigin(path) {
      if (path.substr(0, 8) == 'file:///')
        return path.substr(7 + !!isWindows);
      
      if (windowOrigin && path.substr(0, windowOrigin.length) == windowOrigin)
        return path.substr(windowOrigin.length);

      return path;
    }

    loader.set('@@cjs-helpers', loader.newModule({
      requireResolve: function(request, parentId) {
        return stripOrigin(loader.normalizeSync(request, parentId));
      },
      getPathVars: function(moduleId) {
        // remove any plugin syntax
        var pluginIndex = moduleId.lastIndexOf('!');
        var filename;
        if (pluginIndex != -1)
          filename = moduleId.substr(0, pluginIndex);
        else
          filename = moduleId;

        var dirname = filename.split('/');
        dirname.pop();
        dirname = dirname.join('/');

        return {
          filename: stripOrigin(filename),
          dirname: stripOrigin(dirname)
        };
      }
    }))
  };
});/*
 * AMD Helper function module
 * Separated into its own file as this is the part needed for full AMD support in SFX builds
 * NB since implementations have now diverged this can be merged back with amd.js
 */

hook('fetch', function(fetch) {
  return function(load) {
    // script load implies define global leak
    if (load.metadata.scriptLoad && isBrowser)
      __global.define = this.amdDefine;
    return fetch.call(this, load);
  };
});
 
hookConstructor(function(constructor) {
  return function() {
    var loader = this;
    constructor.call(this);

    var commentRegEx = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
    var cjsRequirePre = "(?:^|[^$_a-zA-Z\\xA0-\\uFFFF.])";
    var cjsRequirePost = "\\s*\\(\\s*(\"([^\"]+)\"|'([^']+)')\\s*\\)";
    var fnBracketRegEx = /\(([^\)]*)\)/;
    var wsRegEx = /^\s+|\s+$/g;
    
    var requireRegExs = {};

    function getCJSDeps(source, requireIndex) {

      // remove comments
      source = source.replace(commentRegEx, '');

      // determine the require alias
      var params = source.match(fnBracketRegEx);
      var requireAlias = (params[1].split(',')[requireIndex] || 'require').replace(wsRegEx, '');

      // find or generate the regex for this requireAlias
      var requireRegEx = requireRegExs[requireAlias] || (requireRegExs[requireAlias] = new RegExp(cjsRequirePre + requireAlias + cjsRequirePost, 'g'));

      requireRegEx.lastIndex = 0;

      var deps = [];

      var match;
      while (match = requireRegEx.exec(source))
        deps.push(match[2] || match[3]);

      return deps;
    }

    /*
      AMD-compatible require
      To copy RequireJS, set window.require = window.requirejs = loader.amdRequire
    */
    function require(names, callback, errback, referer) {
      // in amd, first arg can be a config object... we just ignore
      if (typeof names == 'object' && !(names instanceof Array))
        return require.apply(null, Array.prototype.splice.call(arguments, 1, arguments.length - 1));

      // amd require
      if (typeof names == 'string' && typeof callback == 'function')
        names = [names];
      if (names instanceof Array) {
        var dynamicRequires = [];
        for (var i = 0; i < names.length; i++)
          dynamicRequires.push(loader['import'](names[i], referer));
        Promise.all(dynamicRequires).then(function(modules) {
          if (callback)
            callback.apply(null, modules);
        }, errback);
      }

      // commonjs require
      else if (typeof names == 'string') {
        var defaultJSExtension = loader.defaultJSExtensions && names.substr(names.length - 3, 3) != '.js';
        var normalized = loader.decanonicalize(names, referer);
        if (defaultJSExtension && normalized.substr(normalized.length - 3, 3) == '.js')
          normalized = normalized.substr(0, normalized.length - 3);
        var module = loader.get(normalized);
        if (!module)
          throw new Error('Module not already loaded loading "' + names + '" as ' + normalized + (referer ? ' from "' + referer + '".' : '.'));
        return module.__useDefault ? module['default'] : module;
      }

      else
        throw new TypeError('Invalid require');
    }

    function define(name, deps, factory) {
      if (typeof name != 'string') {
        factory = deps;
        deps = name;
        name = null;
      }
      if (!(deps instanceof Array)) {
        factory = deps;
        deps = ['require', 'exports', 'module'].splice(0, factory.length);
      }

      if (typeof factory != 'function')
        factory = (function(factory) {
          return function() { return factory; }
        })(factory);

      // in IE8, a trailing comma becomes a trailing undefined entry
      if (deps[deps.length - 1] === undefined)
        deps.pop();

      // remove system dependencies
      var requireIndex, exportsIndex, moduleIndex;
      
      if ((requireIndex = indexOf.call(deps, 'require')) != -1) {
        
        deps.splice(requireIndex, 1);

        // only trace cjs requires for non-named
        // named defines assume the trace has already been done
        if (!name)
          deps = deps.concat(getCJSDeps(factory.toString(), requireIndex));
      }

      if ((exportsIndex = indexOf.call(deps, 'exports')) != -1)
        deps.splice(exportsIndex, 1);
      
      if ((moduleIndex = indexOf.call(deps, 'module')) != -1)
        deps.splice(moduleIndex, 1);

      function execute(req, exports, module) {
        var depValues = [];
        for (var i = 0; i < deps.length; i++)
          depValues.push(req(deps[i]));

        module.uri = module.id;

        module.config = function() {};

        // add back in system dependencies
        if (moduleIndex != -1)
          depValues.splice(moduleIndex, 0, module);
        
        if (exportsIndex != -1)
          depValues.splice(exportsIndex, 0, exports);
        
        if (requireIndex != -1) {
          function contextualRequire(names, callback, errback) {
            if (typeof names == 'string' && typeof callback != 'function')
              return req(names);
            return require.call(loader, names, callback, errback, module.id);
          }
          contextualRequire.toUrl = function(name) {
            // normalize without defaultJSExtensions
            var defaultJSExtension = loader.defaultJSExtensions && name.substr(name.length - 3, 3) != '.js';
            var url = loader.decanonicalize(name, module.id);
            if (defaultJSExtension && url.substr(url.length - 3, 3) == '.js')
              url = url.substr(0, url.length - 3);
            return url;
          };
          depValues.splice(requireIndex, 0, contextualRequire);
        }

        // set global require to AMD require
        var curRequire = __global.require;
        __global.require = require;

        var output = factory.apply(exportsIndex == -1 ? __global : exports, depValues);

        __global.require = curRequire;

        if (typeof output == 'undefined' && module)
          output = module.exports;

        if (typeof output != 'undefined')
          return output;
      }

      var entry = createEntry();
      entry.name = name && (loader.decanonicalize || loader.normalize).call(loader, name);
      entry.deps = deps;
      entry.execute = execute;

      loader.pushRegister_({
        amd: true,
        entry: entry
      });
    }
    define.amd = {};

    // reduction function to attach defines to a load record
    hook('reduceRegister_', function(reduceRegister) {
      return function(load, register) {
        // only handle AMD registers here
        if (!register || !register.amd)
          return reduceRegister.call(this, load, register);

        var curMeta = load && load.metadata;
        var entry = register.entry;

        if (curMeta) {
          if (!curMeta.format || curMeta.format == 'detect')
            curMeta.format = 'amd';
          else if (!entry.name && curMeta.format != 'amd')
            throw new Error('AMD define called while executing ' + curMeta.format + ' module ' + load.name);
        }

        // anonymous define
        if (!entry.name) {
          if (!curMeta)
            throw new TypeError('Unexpected anonymous AMD define.');

          if (curMeta.entry && !curMeta.entry.name)
            throw new Error('Multiple anonymous defines in module ' + load.name);
          
          curMeta.entry = entry;
        }
        // named define
        else {
          // if we don't have any other defines, 
          // then let this be an anonymous define
          // this is just to support single modules of the form:
          // define('jquery')
          // still loading anonymously
          // because it is done widely enough to be useful
          // as soon as there is more than one define, this gets removed though
          if (curMeta) {
            if (!curMeta.entry && !curMeta.bundle)
              curMeta.entry = entry;
            else if (curMeta.entry && curMeta.entry.name)
              curMeta.entry = undefined;

            // note this is now a bundle
            curMeta.bundle = true;
          }

          // define the module through the register registry
          if (!(entry.name in this.defined))
            this.defined[entry.name] = entry;
        }
      };
    });

    loader.amdDefine = define;
    loader.amdRequire = require;
  };
});/*
  SystemJS AMD Format
*/
(function() {
  // AMD Module Format Detection RegEx
  // define([.., .., ..], ...)
  // define(varName); || define(function(require, exports) {}); || define({})
  var amdRegEx = /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF.])define\s*\(\s*("[^"]+"\s*,\s*|'[^']+'\s*,\s*)?\s*(\[(\s*(("[^"]+"|'[^']+')\s*,|\/\/.*\r?\n|\/\*(.|\s)*?\*\/))*(\s*("[^"]+"|'[^']+')\s*,?)?(\s*(\/\/.*\r?\n|\/\*(.|\s)*?\*\/))*\s*\]|function\s*|{|[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*\))/;

  hook('instantiate', function(instantiate) {
    return function(load) {
      var loader = this;
      
      if (load.metadata.format == 'amd' || !load.metadata.format && load.source.match(amdRegEx)) {
        load.metadata.format = 'amd';
        
        if (!loader.builder && loader.execute !== false) {
          var curDefine = __global.define;
          __global.define = this.amdDefine;

          try {
            __exec.call(loader, load);
          }
          finally {
            __global.define = curDefine;
          }

          if (!load.metadata.entry && !load.metadata.bundle)
            throw new TypeError('AMD module ' + load.name + ' did not define');
        }
        else {
          load.metadata.execute = function() {
            return load.metadata.builderExecute.apply(this, arguments);
          };
        }
      }

      return instantiate.call(loader, load);
    };
  });

})();
/*
  SystemJS Loader Plugin Support

  Supports plugin loader syntax with "!", or via metadata.loader

  The plugin name is loaded as a module itself, and can override standard loader hooks
  for the plugin resource. See the plugin section of the systemjs readme.
*/

(function() {
  function getParentName(loader, parentName) {
    // if parent is a plugin, normalize against the parent plugin argument only
    if (parentName) {
      var parentPluginIndex;
      if (loader.pluginFirst) {
        if ((parentPluginIndex = parentName.lastIndexOf('!')) != -1)
          return parentName.substr(parentPluginIndex + 1);
      }
      else {
        if ((parentPluginIndex = parentName.indexOf('!')) != -1)
          return parentName.substr(0, parentPluginIndex);
      }

      return parentName;
    }
  }

  function parsePlugin(loader, name) {
    var argumentName;
    var pluginName;

    var pluginIndex = name.lastIndexOf('!');

    if (pluginIndex == -1)
      return;

    if (loader.pluginFirst) {
      argumentName = name.substr(pluginIndex + 1);
      pluginName = name.substr(0, pluginIndex);
    }
    else {
      argumentName = name.substr(0, pluginIndex);
      pluginName = name.substr(pluginIndex + 1) || argumentName.substr(argumentName.lastIndexOf('.') + 1);
    }

    return {
      argument: argumentName,
      plugin: pluginName
    };
  }

  // put name back together after parts have been normalized
  function combinePluginParts(loader, argumentName, pluginName, defaultExtension) {
    if (defaultExtension && argumentName.substr(argumentName.length - 3, 3) == '.js')
      argumentName = argumentName.substr(0, argumentName.length - 3);

    if (loader.pluginFirst) {
      return pluginName + '!' + argumentName;
    }
    else {
      return argumentName + '!' + pluginName;
    }
  }

  // note if normalize will add a default js extension
  // if so, remove for backwards compat
  // this is strange and sucks, but will be deprecated
  function checkDefaultExtension(loader, arg) {
    return loader.defaultJSExtensions && arg.substr(arg.length - 3, 3) != '.js'; 
  }

  function createNormalizeSync(normalizeSync) {
    return function(name, parentName, isPlugin) {
      var loader = this;
      
      parentName = getParentName(this, parentName);
      var parsed = parsePlugin(loader, name);

      if (!parsed)
        return normalizeSync.call(this, name, parentName, isPlugin);

      // if this is a plugin, normalize the plugin name and the argument
      var argumentName = loader.normalizeSync(parsed.argument, parentName, true);
      var pluginName = loader.normalizeSync(parsed.plugin, parentName, true);
      return combinePluginParts(loader, argumentName, pluginName, checkDefaultExtension(loader, parsed.argument));
    };
  }
  
  hook('decanonicalize', createNormalizeSync);
  hook('normalizeSync', createNormalizeSync);

  hook('normalize', function(normalize) {
    return function(name, parentName, isPlugin) {
      var loader = this;

      parentName = getParentName(this, parentName);

      var parsed = parsePlugin(loader, name);

      if (!parsed)
        return normalize.call(loader, name, parentName, isPlugin);

      return Promise.all([
        loader.normalize(parsed.argument, parentName, true),
        loader.normalize(parsed.plugin, parentName)
      ])
      .then(function(normalized) {
        return combinePluginParts(loader, normalized[0], normalized[1], checkDefaultExtension(loader, parsed.argument));
      });
    }
  });

  hook('locate', function(locate) {
    return function(load) {
      var loader = this;

      var name = load.name;

      // plugin syntax
      var pluginSyntaxIndex;
      if (loader.pluginFirst) {
        if ((pluginSyntaxIndex = name.indexOf('!')) != -1) {
          load.metadata.loader = name.substr(0, pluginSyntaxIndex);
          load.name = name.substr(pluginSyntaxIndex + 1);
        }
      }
      else {
        if ((pluginSyntaxIndex = name.lastIndexOf('!')) != -1) {
          load.metadata.loader = name.substr(pluginSyntaxIndex + 1);
          load.name = name.substr(0, pluginSyntaxIndex);
        }
      }

      return locate.call(loader, load)
      .then(function(address) {
        if (pluginSyntaxIndex != -1 || !load.metadata.loader)
          return address;

        // normalize plugin relative to parent in locate here when
        // using plugin via loader metadata
        return loader.normalize(load.metadata.loader, load.name)
        .then(function(loaderNormalized) {
          load.metadata.loader = loaderNormalized;
          return address;
        });
      })
      .then(function(address) {
        var plugin = load.metadata.loader;

        if (!plugin)
          return address;

        // don't allow a plugin to load itself
        if (load.name == plugin)
          throw new Error('Plugin ' + plugin + ' cannot load itself, make sure it is excluded from any wildcard meta configuration via a custom loader: false rule.');

        // only fetch the plugin itself if this name isn't defined
        if (loader.defined && loader.defined[name])
          return address;

        var pluginLoader = loader.pluginLoader || loader;

        // load the plugin module and run standard locate
        return pluginLoader['import'](plugin)
        .then(function(loaderModule) {
          // store the plugin module itself on the metadata
          load.metadata.loaderModule = loaderModule;

          load.address = address;
          if (loaderModule.locate)
            return loaderModule.locate.call(loader, load);

          return address;
        });
      });
    };
  });

  hook('fetch', function(fetch) {
    return function(load) {
      var loader = this;
      if (load.metadata.loaderModule && load.metadata.loaderModule.fetch && load.metadata.format != 'defined') {
        load.metadata.scriptLoad = false;
        return load.metadata.loaderModule.fetch.call(loader, load, function(load) {
          return fetch.call(loader, load);
        });
      }
      else {
        return fetch.call(loader, load);
      }
    };
  });

  hook('translate', function(translate) {
    return function(load) {
      var loader = this;
      if (load.metadata.loaderModule && load.metadata.loaderModule.translate && load.metadata.format != 'defined') {
        return Promise.resolve(load.metadata.loaderModule.translate.call(loader, load)).then(function(result) {
          var sourceMap = load.metadata.sourceMap;

          // sanitize sourceMap if an object not a JSON string
          if (sourceMap) {
            if (typeof sourceMap != 'object')
              throw new Error('load.metadata.sourceMap must be set to an object.');

            var originalName = load.name.split('!')[0];
            
            // force set the filename of the original file
            sourceMap.file = originalName + '!transpiled';

            // force set the sources list if only one source
            if (!sourceMap.sources || sourceMap.sources.length <= 1)
              sourceMap.sources = [originalName];
          }

          // if running on file:/// URLs, sourcesContent is necessary
          // load.metadata.sourceMap.sourcesContent = [load.source];

          if (typeof result == 'string')
            load.source = result;
          else
            warn.call(this, 'Plugin ' + load.metadata.loader + ' should return the source in translate, instead of setting load.source directly. This support will be deprecated.');

          return translate.call(loader, load);
        });
      }
      else {
        return translate.call(loader, load);
      }
    };
  });

  hook('instantiate', function(instantiate) {
    return function(load) {
      var loader = this;
      var calledInstantiate = false;

      if (load.metadata.loaderModule && load.metadata.loaderModule.instantiate && !loader.builder && load.metadata.format != 'defined')
        return Promise.resolve(load.metadata.loaderModule.instantiate.call(loader, load, function(load) {
          if (calledInstantiate)
            throw new Error('Instantiate must only be called once.');
          calledInstantiate = true;
          return instantiate.call(loader, load);
        })).then(function(result) {
          if (calledInstantiate)
            return result;

          load.metadata.entry = createEntry();
          load.metadata.entry.execute = function() {
            return result;
          }
          load.metadata.entry.deps = load.metadata.deps;
          load.metadata.format = 'defined';
          return instantiate.call(loader, load);
        });
      else
        return instantiate.call(loader, load);
    };
  });

})();/*
 * Conditions Extension
 *
 *   Allows a condition module to alter the resolution of an import via syntax:
 *
 *     import $ from 'jquery/#{browser}';
 *
 *   Will first load the module 'browser' via `SystemJS.import('browser')` and 
 *   take the default export of that module.
 *   If the default export is not a string, an error is thrown.
 * 
 *   We then substitute the string into the require to get the conditional resolution
 *   enabling environment-specific variations like:
 * 
 *     import $ from 'jquery/ie'
 *     import $ from 'jquery/firefox'
 *     import $ from 'jquery/chrome'
 *     import $ from 'jquery/safari'
 *
 *   It can be useful for a condition module to define multiple conditions.
 *   This can be done via the `|` modifier to specify an export member expression:
 *
 *     import 'jquery/#{./browser.js|grade.version}'
 *
 *   Where the `grade` export `version` member in the `browser.js` module  is substituted.
 *
 *
 * Boolean Conditionals
 *
 *   For polyfill modules, that are used as imports but have no module value,
 *   a binary conditional allows a module not to be loaded at all if not needed:
 *
 *     import 'es5-shim#?./conditions.js|needs-es5shim'
 *
 *   These conditions can also be negated via:
 *     
 *     import 'es5-shim#?~./conditions.js|es6'
 *
 */

  function parseCondition(condition) {
    var conditionExport, conditionModule, negation;

    var negation = condition[0] == '~';
    var conditionExportIndex = condition.lastIndexOf('|');
    if (conditionExportIndex != -1) {
      conditionExport = condition.substr(conditionExportIndex + 1);
      conditionModule = condition.substr(negation, conditionExportIndex - negation) || '@system-env';
    }
    else {
      conditionExport = null;
      conditionModule = condition.substr(negation);
    }

    return {
      module: conditionModule,
      prop: conditionExport,
      negate: negation
    };
  }

  function serializeCondition(conditionObj) {
    return (conditionObj.negate ? '~' : '') + conditionObj.module + (conditionObj.prop ? '|' + conditionObj.prop : '');
  }

  function resolveCondition(conditionObj, parentName, bool) {
    return this['import'](conditionObj.module, parentName)
    .then(function(m) {
      if (conditionObj.prop)
        m = readMemberExpression(conditionObj.prop, m);
      else if (typeof m == 'object' && m + '' == 'Module')
        m = m['default'];

      if (bool && typeof m != 'boolean')
        throw new TypeError('Condition ' + serializeCondition(conditionObj) + ' did not resolve to a boolean.');

      return conditionObj.negate ? !m : m;
    });
  }

  var interpolationRegEx = /#\{[^\}]+\}/;
  function interpolateConditional(name, parentName) {
    // first we normalize the conditional
    var conditionalMatch = name.match(interpolationRegEx);

    if (!conditionalMatch)
      return Promise.resolve(name);

    var conditionObj = parseCondition(conditionalMatch[0].substr(2, conditionalMatch[0].length - 3));

    // in builds, return normalized conditional
    if (this.builder)
      return this['normalize'](conditionObj.module, parentName)
      .then(function(conditionModule) {
        conditionObj.module = conditionModule;
        return name.replace(interpolationRegEx, '#{' + serializeCondition(conditionObj) + '}');
      });

    return resolveCondition.call(this, conditionObj, parentName, false)
    .then(function(conditionValue) {
      if (typeof conditionValue !== 'string')
        throw new TypeError('The condition value for ' + name + ' doesn\'t resolve to a string.');

      if (conditionValue.indexOf('/') != -1)
        throw new TypeError('Unabled to interpolate conditional ' + name + (parentName ? ' in ' + parentName : '') + '\n\tThe condition value ' + conditionValue + ' cannot contain a "/" separator.');

      return name.replace(interpolationRegEx, conditionValue);
    });
  }

  function booleanConditional(name, parentName) {
    // first we normalize the conditional
    var booleanIndex = name.lastIndexOf('#?');

    if (booleanIndex == -1)
      return Promise.resolve(name);

    var conditionObj = parseCondition(name.substr(booleanIndex + 2));

    // in builds, return normalized conditional
    if (this.builder)
      return this['normalize'](conditionObj.module, parentName)
      .then(function(conditionModule) {
        conditionObj.module = conditionModule;
        return name.substr(0, booleanIndex) + '#?' + serializeCondition(conditionObj);
      });

    return resolveCondition.call(this, conditionObj, parentName, true)
    .then(function(conditionValue) {
      return conditionValue ? name.substr(0, booleanIndex) : '@empty';
    });
  }

  // normalizeSync does not parse conditionals at all although it could
  hook('normalize', function(normalize) {
    return function(name, parentName, parentAddress) {
      var loader = this;
      return booleanConditional.call(loader, name, parentName)
      .then(function(name) {
        return normalize.call(loader, name, parentName, parentAddress);
      })
      .then(function(normalized) {
        return interpolateConditional.call(loader, normalized, parentName);
      });
    };
  });
/*
 * Alias Extension
 *
 * Allows a module to be a plain copy of another module by module name
 *
 * SystemJS.meta['mybootstrapalias'] = { alias: 'bootstrap' };
 *
 */
(function() {
  // aliases
  hook('fetch', function(fetch) {
    return function(load) {
      var alias = load.metadata.alias;
      var aliasDeps = load.metadata.deps || [];
      if (alias) {
        load.metadata.format = 'defined';
        var entry = createEntry();
        this.defined[load.name] = entry;
        entry.declarative = true;
        entry.deps = aliasDeps.concat([alias]);
        entry.declare = function(_export) {
          return {
            setters: [function(module) {
              for (var p in module)
                _export(p, module[p]);
              if (module.__useDefault)
                entry.module.exports.__useDefault = true;
            }],
            execute: function() {}
          };
        };
        return '';
      }

      return fetch.call(this, load);
    };
  });
})();/*
 * Meta Extension
 *
 * Sets default metadata on a load record (load.metadata) from
 * loader.metadata via SystemJS.meta function.
 *
 *
 * Also provides an inline meta syntax for module meta in source.
 *
 * Eg:
 *
 * loader.meta({
 *   'my/module': { deps: ['jquery'] }
 *   'my/*': { format: 'amd' }
 * });
 *
 * Which in turn populates loader.metadata.
 *
 * load.metadata.deps and load.metadata.format will then be set
 * for 'my/module'
 *
 * The same meta could be set with a my/module.js file containing:
 *
 * my/module.js
 *   "format amd";
 *   "deps[] jquery";
 *   "globals.some value"
 *   console.log('this is my/module');
 *
 * Configuration meta always takes preference to inline meta.
 *
 * Multiple matches in wildcards are supported and ammend the meta.
 *
 *
 * The benefits of the function form is that paths are URL-normalized
 * supporting say
 *
 * loader.meta({ './app': { format: 'cjs' } });
 *
 * Instead of needing to set against the absolute URL (https://site.com/app.js)
 *
 */

(function() {

  hookConstructor(function(constructor) {
    return function() {
      this.meta = {};
      constructor.call(this);
    };
  });

  hook('locate', function(locate) {
    return function(load) {
      var meta = this.meta;
      var name = load.name;

      // NB for perf, maybe introduce a fast-path wildcard lookup cache here
      // which is checked first

      // apply wildcard metas
      var bestDepth = 0;
      var wildcardIndex;
      for (var module in meta) {
        wildcardIndex = module.indexOf('*');
        if (wildcardIndex === -1)
          continue;
        if (module.substr(0, wildcardIndex) === name.substr(0, wildcardIndex)
            && module.substr(wildcardIndex + 1) === name.substr(name.length - module.length + wildcardIndex + 1)) {
          var depth = module.split('/').length;
          if (depth > bestDepth)
            bestDepth = depth;
          extendMeta(load.metadata, meta[module], bestDepth != depth);
        }
      }

      // apply exact meta
      if (meta[name])
        extendMeta(load.metadata, meta[name]);

      return locate.call(this, load);
    };
  });

  // detect any meta header syntax
  // only set if not already set
  var metaRegEx = /^(\s*\/\*[^\*]*(\*(?!\/)[^\*]*)*\*\/|\s*\/\/[^\n]*|\s*"[^"]+"\s*;?|\s*'[^']+'\s*;?)+/;
  var metaPartRegEx = /\/\*[^\*]*(\*(?!\/)[^\*]*)*\*\/|\/\/[^\n]*|"[^"]+"\s*;?|'[^']+'\s*;?/g;

  function setMetaProperty(target, p, value) {
    var pParts = p.split('.');
    var curPart;
    while (pParts.length > 1) {
      curPart = pParts.shift();
      target = target[curPart] = target[curPart] || {};
    }
    curPart = pParts.shift();
    if (!(curPart in target))
      target[curPart] = value;
  }

  hook('translate', function(translate) {
    return function(load) {
      // NB meta will be post-translate pending transpiler conversion to plugins
      var meta = load.source.match(metaRegEx);
      if (meta) {
        var metaParts = meta[0].match(metaPartRegEx);

        for (var i = 0; i < metaParts.length; i++) {
          var curPart = metaParts[i];
          var len = curPart.length;

          var firstChar = curPart.substr(0, 1);
          if (curPart.substr(len - 1, 1) == ';')
            len--;

          if (firstChar != '"' && firstChar != "'")
            continue;

          var metaString = curPart.substr(1, curPart.length - 3);
          var metaName = metaString.substr(0, metaString.indexOf(' '));

          if (metaName) {
            var metaValue = metaString.substr(metaName.length + 1, metaString.length - metaName.length - 1);

            if (metaName.substr(metaName.length - 2, 2) == '[]') {
              metaName = metaName.substr(0, metaName.length - 2);
              load.metadata[metaName] = load.metadata[metaName] || [];
              load.metadata[metaName].push(metaValue);
            }
            else if (load.metadata[metaName] instanceof Array) {
              // temporary backwards compat for previous "deps" syntax
              warn.call(this, 'Module ' + load.name + ' contains deprecated "deps ' + metaValue + '" meta syntax.\nThis should be updated to "deps[] ' + metaValue + '" for pushing to array meta.');
              load.metadata[metaName].push(metaValue);
            }
            else {
              setMetaProperty(load.metadata, metaName, metaValue);
            }
          }
          else {
            load.metadata[metaString] = true;
          }
        }
      }

      return translate.call(this, load);
    };
  });
})();
/*
  System bundles

  Allows a bundle module to be specified which will be dynamically 
  loaded before trying to load a given module.

  For example:
  SystemJS.bundles['mybundle'] = ['jquery', 'bootstrap/js/bootstrap']

  Will result in a load to "mybundle" whenever a load to "jquery"
  or "bootstrap/js/bootstrap" is made.

  In this way, the bundle becomes the request that provides the module
*/

(function() {
  // bundles support (just like RequireJS)
  // bundle name is module name of bundle itself
  // bundle is array of modules defined by the bundle
  // when a module in the bundle is requested, the bundle is loaded instead
  // of the form SystemJS.bundles['mybundle'] = ['jquery', 'bootstrap/js/bootstrap']
  hookConstructor(function(constructor) {
    return function() {
      constructor.call(this);
      this.bundles = {};
      this._loader.loadedBundles = {};
    };
  });

  // assign bundle metadata for bundle loads
  hook('locate', function(locate) {
    return function(load) {
      var loader = this;
      var matched = false;

      if (!(load.name in loader.defined))
        for (var b in loader.bundles) {
          for (var i = 0; i < loader.bundles[b].length; i++) {
            var curModule = loader.bundles[b][i];

            if (curModule == load.name) {
              matched = true;
              break;
            }

            // wildcard in bundles does not include / boundaries
            if (curModule.indexOf('*') != -1) {
              var parts = curModule.split('*');
              if (parts.length != 2) {
                loader.bundles[b].splice(i--, 1);
                continue;
              }
              
              if (load.name.substring(0, parts[0].length) == parts[0] &&
                  load.name.substr(load.name.length - parts[1].length, parts[1].length) == parts[1] &&
                  load.name.substr(parts[0].length, load.name.length - parts[1].length - parts[0].length).indexOf('/') == -1) {
                matched = true;
                break;
              }
            }
          }

          if (matched)
            return loader['import'](b)
            .then(function() {
              return locate.call(loader, load);
            });
        }

      return locate.call(loader, load);
    };
  });
})();
/*
 * Dependency Tree Cache
 * 
 * Allows a build to pre-populate a dependency trace tree on the loader of 
 * the expected dependency tree, to be loaded upfront when requesting the
 * module, avoinding the n round trips latency of module loading, where 
 * n is the dependency tree depth.
 *
 * eg:
 * SystemJS.depCache = {
 *  'app': ['normalized', 'deps'],
 *  'normalized': ['another'],
 *  'deps': ['tree']
 * };
 * 
 * SystemJS.import('app') 
 * // simultaneously starts loading all of:
 * // 'normalized', 'deps', 'another', 'tree'
 * // before "app" source is even loaded
 *
 */

(function() {
  hookConstructor(function(constructor) {
    return function() {
      constructor.call(this);
      this.depCache = {};
    }
  });

  hook('locate', function(locate) {
    return function(load) {
      var loader = this;
      // load direct deps, in turn will pick up their trace trees
      var deps = loader.depCache[load.name];
      if (deps)
        for (var i = 0; i < deps.length; i++)
          loader['import'](deps[i], load.name);

      return locate.call(loader, load);
    };
  });
})();
  
System = new SystemJSLoader();

__global.SystemJS = System;
System.version = '0.19.27 Standard';
  // -- exporting --

  if (typeof exports === 'object')
    module.exports = Loader;

  __global.Reflect = __global.Reflect || {};
  __global.Reflect.Loader = __global.Reflect.Loader || Loader;
  __global.Reflect.global = __global.Reflect.global || __global;
  __global.LoaderPolyfill = Loader;

  if (!System) {
    System = new SystemLoader();
    System.constructor = SystemLoader;
  }

  if (typeof exports === 'object')
    module.exports = System;

  __global.System = System;

})(typeof self != 'undefined' ? self : global);}

// auto-load Promise polyfill if needed in the browser
var doPolyfill = typeof Promise === 'undefined';

// document.write
if (typeof document !== 'undefined') {
  var scripts = document.getElementsByTagName('script');
  $__curScript = scripts[scripts.length - 1];
  if (doPolyfill) {
    var curPath = $__curScript.src;
    var basePath = curPath.substr(0, curPath.lastIndexOf('/') + 1);
    window.systemJSBootstrap = bootstrap;
    document.write(
      '<' + 'script type="text/javascript" src="' + basePath + 'system-polyfills.js">' + '<' + '/script>'
    );
  }
  else {
    bootstrap();
  }
}
// importScripts
else if (typeof importScripts !== 'undefined') {
  var basePath = '';
  try {
    throw new Error('_');
  } catch (e) {
    e.stack.replace(/(?:at|@).*(http.+):[\d]+:[\d]+/, function(m, url) {
      $__curScript = { src: url };
      basePath = url.replace(/\/[^\/]*$/, '/');
    });
  }
  if (doPolyfill)
    importScripts(basePath + 'system-polyfills.js');
  bootstrap();
}
else {
  $__curScript = typeof __filename != 'undefined' ? { src: __filename } : null;
  bootstrap();
}


})();
/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (factory());
}(this, (function () { 'use strict';

var Zone$1 = (function (global) {
    if (global.Zone) {
        throw new Error('Zone already loaded.');
    }
    var Zone = (function () {
        function Zone(parent, zoneSpec) {
            this._properties = null;
            this._parent = parent;
            this._name = zoneSpec ? zoneSpec.name || 'unnamed' : '<root>';
            this._properties = zoneSpec && zoneSpec.properties || {};
            this._zoneDelegate = new ZoneDelegate(this, this._parent && this._parent._zoneDelegate, zoneSpec);
        }
        Zone.assertZonePatched = function () {
            if (global.Promise !== ZoneAwarePromise) {
                throw new Error("Zone.js has detected that ZoneAwarePromise `(window|global).Promise` " +
                    "has been overwritten.\n" +
                    "Most likely cause is that a Promise polyfill has been loaded " +
                    "after Zone.js (Polyfilling Promise api is not necessary when zone.js is loaded. " +
                    "If you must load one, do so before loading zone.js.)");
            }
        };
        Object.defineProperty(Zone, "current", {
            get: function () { return _currentZone; },
            enumerable: true,
            configurable: true
        });
        
        Object.defineProperty(Zone, "currentTask", {
            get: function () { return _currentTask; },
            enumerable: true,
            configurable: true
        });
        
        Object.defineProperty(Zone.prototype, "parent", {
            get: function () { return this._parent; },
            enumerable: true,
            configurable: true
        });
        
        Object.defineProperty(Zone.prototype, "name", {
            get: function () { return this._name; },
            enumerable: true,
            configurable: true
        });
        
        Zone.prototype.get = function (key) {
            var zone = this.getZoneWith(key);
            if (zone)
                return zone._properties[key];
        };
        Zone.prototype.getZoneWith = function (key) {
            var current = this;
            while (current) {
                if (current._properties.hasOwnProperty(key)) {
                    return current;
                }
                current = current._parent;
            }
            return null;
        };
        Zone.prototype.fork = function (zoneSpec) {
            if (!zoneSpec)
                throw new Error('ZoneSpec required!');
            return this._zoneDelegate.fork(this, zoneSpec);
        };
        Zone.prototype.wrap = function (callback, source) {
            if (typeof callback !== 'function') {
                throw new Error('Expecting function got: ' + callback);
            }
            var _callback = this._zoneDelegate.intercept(this, callback, source);
            var zone = this;
            return function () {
                return zone.runGuarded(_callback, this, arguments, source);
            };
        };
        Zone.prototype.run = function (callback, applyThis, applyArgs, source) {
            if (applyThis === void 0) { applyThis = null; }
            if (applyArgs === void 0) { applyArgs = null; }
            if (source === void 0) { source = null; }
            var oldZone = _currentZone;
            _currentZone = this;
            try {
                return this._zoneDelegate.invoke(this, callback, applyThis, applyArgs, source);
            }
            finally {
                _currentZone = oldZone;
            }
        };
        Zone.prototype.runGuarded = function (callback, applyThis, applyArgs, source) {
            if (applyThis === void 0) { applyThis = null; }
            if (applyArgs === void 0) { applyArgs = null; }
            if (source === void 0) { source = null; }
            var oldZone = _currentZone;
            _currentZone = this;
            try {
                try {
                    return this._zoneDelegate.invoke(this, callback, applyThis, applyArgs, source);
                }
                catch (error) {
                    if (this._zoneDelegate.handleError(this, error)) {
                        throw error;
                    }
                }
            }
            finally {
                _currentZone = oldZone;
            }
        };
        Zone.prototype.runTask = function (task, applyThis, applyArgs) {
            task.runCount++;
            if (task.zone != this)
                throw new Error('A task can only be run in the zone which created it! (Creation: ' +
                    task.zone.name + '; Execution: ' + this.name + ')');
            var previousTask = _currentTask;
            _currentTask = task;
            var oldZone = _currentZone;
            _currentZone = this;
            try {
                if (task.type == 'macroTask' && task.data && !task.data.isPeriodic) {
                    task.cancelFn = null;
                }
                try {
                    return this._zoneDelegate.invokeTask(this, task, applyThis, applyArgs);
                }
                catch (error) {
                    if (this._zoneDelegate.handleError(this, error)) {
                        throw error;
                    }
                }
            }
            finally {
                _currentZone = oldZone;
                _currentTask = previousTask;
            }
        };
        Zone.prototype.scheduleMicroTask = function (source, callback, data, customSchedule) {
            return this._zoneDelegate.scheduleTask(this, new ZoneTask('microTask', this, source, callback, data, customSchedule, null));
        };
        Zone.prototype.scheduleMacroTask = function (source, callback, data, customSchedule, customCancel) {
            return this._zoneDelegate.scheduleTask(this, new ZoneTask('macroTask', this, source, callback, data, customSchedule, customCancel));
        };
        Zone.prototype.scheduleEventTask = function (source, callback, data, customSchedule, customCancel) {
            return this._zoneDelegate.scheduleTask(this, new ZoneTask('eventTask', this, source, callback, data, customSchedule, customCancel));
        };
        Zone.prototype.cancelTask = function (task) {
            var value = this._zoneDelegate.cancelTask(this, task);
            task.runCount = -1;
            task.cancelFn = null;
            return value;
        };
        Zone.__symbol__ = __symbol__;
        return Zone;
    }());
    
    var ZoneDelegate = (function () {
        function ZoneDelegate(zone, parentDelegate, zoneSpec) {
            this._taskCounts = { microTask: 0, macroTask: 0, eventTask: 0 };
            this.zone = zone;
            this._parentDelegate = parentDelegate;
            this._forkZS = zoneSpec && (zoneSpec && zoneSpec.onFork ? zoneSpec : parentDelegate._forkZS);
            this._forkDlgt = zoneSpec && (zoneSpec.onFork ? parentDelegate : parentDelegate._forkDlgt);
            this._interceptZS = zoneSpec && (zoneSpec.onIntercept ? zoneSpec : parentDelegate._interceptZS);
            this._interceptDlgt = zoneSpec && (zoneSpec.onIntercept ? parentDelegate : parentDelegate._interceptDlgt);
            this._invokeZS = zoneSpec && (zoneSpec.onInvoke ? zoneSpec : parentDelegate._invokeZS);
            this._invokeDlgt = zoneSpec && (zoneSpec.onInvoke ? parentDelegate : parentDelegate._invokeDlgt);
            this._handleErrorZS = zoneSpec && (zoneSpec.onHandleError ? zoneSpec : parentDelegate._handleErrorZS);
            this._handleErrorDlgt = zoneSpec && (zoneSpec.onHandleError ? parentDelegate : parentDelegate._handleErrorDlgt);
            this._scheduleTaskZS = zoneSpec && (zoneSpec.onScheduleTask ? zoneSpec : parentDelegate._scheduleTaskZS);
            this._scheduleTaskDlgt = zoneSpec && (zoneSpec.onScheduleTask ? parentDelegate : parentDelegate._scheduleTaskDlgt);
            this._invokeTaskZS = zoneSpec && (zoneSpec.onInvokeTask ? zoneSpec : parentDelegate._invokeTaskZS);
            this._invokeTaskDlgt = zoneSpec && (zoneSpec.onInvokeTask ? parentDelegate : parentDelegate._invokeTaskDlgt);
            this._cancelTaskZS = zoneSpec && (zoneSpec.onCancelTask ? zoneSpec : parentDelegate._cancelTaskZS);
            this._cancelTaskDlgt = zoneSpec && (zoneSpec.onCancelTask ? parentDelegate : parentDelegate._cancelTaskDlgt);
            this._hasTaskZS = zoneSpec && (zoneSpec.onHasTask ? zoneSpec : parentDelegate._hasTaskZS);
            this._hasTaskDlgt = zoneSpec && (zoneSpec.onHasTask ? parentDelegate : parentDelegate._hasTaskDlgt);
        }
        ZoneDelegate.prototype.fork = function (targetZone, zoneSpec) {
            return this._forkZS
                ? this._forkZS.onFork(this._forkDlgt, this.zone, targetZone, zoneSpec)
                : new Zone(targetZone, zoneSpec);
        };
        ZoneDelegate.prototype.intercept = function (targetZone, callback, source) {
            return this._interceptZS
                ? this._interceptZS.onIntercept(this._interceptDlgt, this.zone, targetZone, callback, source)
                : callback;
        };
        ZoneDelegate.prototype.invoke = function (targetZone, callback, applyThis, applyArgs, source) {
            return this._invokeZS
                ? this._invokeZS.onInvoke(this._invokeDlgt, this.zone, targetZone, callback, applyThis, applyArgs, source)
                : callback.apply(applyThis, applyArgs);
        };
        ZoneDelegate.prototype.handleError = function (targetZone, error) {
            return this._handleErrorZS
                ? this._handleErrorZS.onHandleError(this._handleErrorDlgt, this.zone, targetZone, error)
                : true;
        };
        ZoneDelegate.prototype.scheduleTask = function (targetZone, task) {
            try {
                if (this._scheduleTaskZS) {
                    return this._scheduleTaskZS.onScheduleTask(this._scheduleTaskDlgt, this.zone, targetZone, task);
                }
                else if (task.scheduleFn) {
                    task.scheduleFn(task);
                }
                else if (task.type == 'microTask') {
                    scheduleMicroTask(task);
                }
                else {
                    throw new Error('Task is missing scheduleFn.');
                }
                return task;
            }
            finally {
                if (targetZone == this.zone) {
                    this._updateTaskCount(task.type, 1);
                }
            }
        };
        ZoneDelegate.prototype.invokeTask = function (targetZone, task, applyThis, applyArgs) {
            try {
                return this._invokeTaskZS
                    ? this._invokeTaskZS.onInvokeTask(this._invokeTaskDlgt, this.zone, targetZone, task, applyThis, applyArgs)
                    : task.callback.apply(applyThis, applyArgs);
            }
            finally {
                if (targetZone == this.zone && (task.type != 'eventTask') && !(task.data && task.data.isPeriodic)) {
                    this._updateTaskCount(task.type, -1);
                }
            }
        };
        ZoneDelegate.prototype.cancelTask = function (targetZone, task) {
            var value;
            if (this._cancelTaskZS) {
                value = this._cancelTaskZS.onCancelTask(this._cancelTaskDlgt, this.zone, targetZone, task);
            }
            else if (!task.cancelFn) {
                throw new Error('Task does not support cancellation, or is already canceled.');
            }
            else {
                value = task.cancelFn(task);
            }
            if (targetZone == this.zone) {
                // this should not be in the finally block, because exceptions assume not canceled.
                this._updateTaskCount(task.type, -1);
            }
            return value;
        };
        ZoneDelegate.prototype.hasTask = function (targetZone, isEmpty) {
            return this._hasTaskZS && this._hasTaskZS.onHasTask(this._hasTaskDlgt, this.zone, targetZone, isEmpty);
        };
        ZoneDelegate.prototype._updateTaskCount = function (type, count) {
            var counts = this._taskCounts;
            var prev = counts[type];
            var next = counts[type] = prev + count;
            if (next < 0) {
                throw new Error('More tasks executed then were scheduled.');
            }
            if (prev == 0 || next == 0) {
                var isEmpty = {
                    microTask: counts.microTask > 0,
                    macroTask: counts.macroTask > 0,
                    eventTask: counts.eventTask > 0,
                    change: type
                };
                try {
                    this.hasTask(this.zone, isEmpty);
                }
                finally {
                    if (this._parentDelegate) {
                        this._parentDelegate._updateTaskCount(type, count);
                    }
                }
            }
        };
        return ZoneDelegate;
    }());
    var ZoneTask = (function () {
        function ZoneTask(type, zone, source, callback, options, scheduleFn, cancelFn) {
            this.runCount = 0;
            this.type = type;
            this.zone = zone;
            this.source = source;
            this.data = options;
            this.scheduleFn = scheduleFn;
            this.cancelFn = cancelFn;
            this.callback = callback;
            var self = this;
            this.invoke = function () {
                _numberOfNestedTaskFrames++;
                try {
                    return zone.runTask(self, this, arguments);
                }
                finally {
                    if (_numberOfNestedTaskFrames == 1) {
                        drainMicroTaskQueue();
                    }
                    _numberOfNestedTaskFrames--;
                }
            };
        }
        ZoneTask.prototype.toString = function () {
            if (this.data && typeof this.data.handleId !== 'undefined') {
                return this.data.handleId;
            }
            else {
                return this.toString();
            }
        };
        return ZoneTask;
    }());
    function __symbol__(name) { return '__zone_symbol__' + name; }
    
    var symbolSetTimeout = __symbol__('setTimeout');
    var symbolPromise = __symbol__('Promise');
    var symbolThen = __symbol__('then');
    var _currentZone = new Zone(null, null);
    var _currentTask = null;
    var _microTaskQueue = [];
    var _isDrainingMicrotaskQueue = false;
    var _uncaughtPromiseErrors = [];
    var _numberOfNestedTaskFrames = 0;
    function scheduleQueueDrain() {
        // if we are not running in any task, and there has not been anything scheduled
        // we must bootstrap the initial task creation by manually scheduling the drain
        if (_numberOfNestedTaskFrames == 0 && _microTaskQueue.length == 0) {
            // We are not running in Task, so we need to kickstart the microtask queue.
            if (global[symbolPromise]) {
                global[symbolPromise].resolve(0)[symbolThen](drainMicroTaskQueue);
            }
            else {
                global[symbolSetTimeout](drainMicroTaskQueue, 0);
            }
        }
    }
    function scheduleMicroTask(task) {
        scheduleQueueDrain();
        _microTaskQueue.push(task);
    }
    function consoleError(e) {
        var rejection = e && e.rejection;
        if (rejection) {
            console.error('Unhandled Promise rejection:', rejection instanceof Error ? rejection.message : rejection, '; Zone:', e.zone.name, '; Task:', e.task && e.task.source, '; Value:', rejection, rejection instanceof Error ? rejection.stack : undefined);
        }
        console.error(e);
    }
    function drainMicroTaskQueue() {
        if (!_isDrainingMicrotaskQueue) {
            _isDrainingMicrotaskQueue = true;
            while (_microTaskQueue.length) {
                var queue = _microTaskQueue;
                _microTaskQueue = [];
                for (var i = 0; i < queue.length; i++) {
                    var task = queue[i];
                    try {
                        task.zone.runTask(task, null, null);
                    }
                    catch (e) {
                        consoleError(e);
                    }
                }
            }
            while (_uncaughtPromiseErrors.length) {
                var _loop_1 = function() {
                    var uncaughtPromiseError = _uncaughtPromiseErrors.shift();
                    try {
                        uncaughtPromiseError.zone.runGuarded(function () { throw uncaughtPromiseError; });
                    }
                    catch (e) {
                        consoleError(e);
                    }
                };
                while (_uncaughtPromiseErrors.length) {
                    _loop_1();
                }
            }
            _isDrainingMicrotaskQueue = false;
        }
    }
    function isThenable(value) {
        return value && value.then;
    }
    function forwardResolution(value) { return value; }
    function forwardRejection(rejection) { return ZoneAwarePromise.reject(rejection); }
    var symbolState = __symbol__('state');
    var symbolValue = __symbol__('value');
    var source = 'Promise.then';
    var UNRESOLVED = null;
    var RESOLVED = true;
    var REJECTED = false;
    var REJECTED_NO_CATCH = 0;
    function makeResolver(promise, state) {
        return function (v) {
            resolvePromise(promise, state, v);
            // Do not return value or you will break the Promise spec.
        };
    }
    function resolvePromise(promise, state, value) {
        if (promise[symbolState] === UNRESOLVED) {
            if (value instanceof ZoneAwarePromise && value[symbolState] !== UNRESOLVED) {
                clearRejectedNoCatch(value);
                resolvePromise(promise, value[symbolState], value[symbolValue]);
            }
            else if (isThenable(value)) {
                value.then(makeResolver(promise, state), makeResolver(promise, false));
            }
            else {
                promise[symbolState] = state;
                var queue = promise[symbolValue];
                promise[symbolValue] = value;
                for (var i = 0; i < queue.length;) {
                    scheduleResolveOrReject(promise, queue[i++], queue[i++], queue[i++], queue[i++]);
                }
                if (queue.length == 0 && state == REJECTED) {
                    promise[symbolState] = REJECTED_NO_CATCH;
                    try {
                        throw new Error("Uncaught (in promise): " + value);
                    }
                    catch (e) {
                        var error_1 = e;
                        error_1.rejection = value;
                        error_1.promise = promise;
                        error_1.zone = Zone.current;
                        error_1.task = Zone.currentTask;
                        _uncaughtPromiseErrors.push(error_1);
                        scheduleQueueDrain();
                    }
                }
            }
        }
        // Resolving an already resolved promise is a noop.
        return promise;
    }
    function clearRejectedNoCatch(promise) {
        if (promise[symbolState] === REJECTED_NO_CATCH) {
            promise[symbolState] = REJECTED;
            for (var i = 0; i < _uncaughtPromiseErrors.length; i++) {
                if (promise === _uncaughtPromiseErrors[i].promise) {
                    _uncaughtPromiseErrors.splice(i, 1);
                    break;
                }
            }
        }
    }
    function scheduleResolveOrReject(promise, zone, chainPromise, onFulfilled, onRejected) {
        clearRejectedNoCatch(promise);
        var delegate = promise[symbolState] ? onFulfilled || forwardResolution : onRejected || forwardRejection;
        zone.scheduleMicroTask(source, function () {
            try {
                resolvePromise(chainPromise, true, zone.run(delegate, null, [promise[symbolValue]]));
            }
            catch (error) {
                resolvePromise(chainPromise, false, error);
            }
        });
    }
    var ZoneAwarePromise = (function () {
        function ZoneAwarePromise(executor) {
            var promise = this;
            if (!(promise instanceof ZoneAwarePromise)) {
                throw new Error('Must be an instanceof Promise.');
            }
            promise[symbolState] = UNRESOLVED;
            promise[symbolValue] = []; // queue;
            try {
                executor && executor(makeResolver(promise, RESOLVED), makeResolver(promise, REJECTED));
            }
            catch (e) {
                resolvePromise(promise, false, e);
            }
        }
        ZoneAwarePromise.resolve = function (value) {
            return resolvePromise(new this(null), RESOLVED, value);
        };
        ZoneAwarePromise.reject = function (error) {
            return resolvePromise(new this(null), REJECTED, error);
        };
        ZoneAwarePromise.race = function (values) {
            var resolve;
            var reject;
            var promise = new this(function (res, rej) { resolve = res; reject = rej; });
            function onResolve(value) { promise && (promise = null || resolve(value)); }
            function onReject(error) { promise && (promise = null || reject(error)); }
            for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
                var value = values_1[_i];
                if (!isThenable(value)) {
                    value = this.resolve(value);
                }
                value.then(onResolve, onReject);
            }
            return promise;
        };
        ZoneAwarePromise.all = function (values) {
            var resolve;
            var reject;
            var promise = new this(function (res, rej) { resolve = res; reject = rej; });
            var count = 0;
            var resolvedValues = [];
            for (var _i = 0, values_2 = values; _i < values_2.length; _i++) {
                var value = values_2[_i];
                if (!isThenable(value)) {
                    value = this.resolve(value);
                }
                value.then((function (index) { return function (value) {
                    resolvedValues[index] = value;
                    count--;
                    if (!count) {
                        resolve(resolvedValues);
                    }
                }; })(count), reject);
                count++;
            }
            if (!count)
                resolve(resolvedValues);
            return promise;
        };
        ZoneAwarePromise.prototype.then = function (onFulfilled, onRejected) {
            var chainPromise = new this.constructor(null);
            var zone = Zone.current;
            if (this[symbolState] == UNRESOLVED) {
                this[symbolValue].push(zone, chainPromise, onFulfilled, onRejected);
            }
            else {
                scheduleResolveOrReject(this, zone, chainPromise, onFulfilled, onRejected);
            }
            return chainPromise;
        };
        ZoneAwarePromise.prototype.catch = function (onRejected) {
            return this.then(null, onRejected);
        };
        return ZoneAwarePromise;
    }());
    // Protect against aggressive optimizers dropping seemingly unused properties.
    // E.g. Closure Compiler in advanced mode.
    ZoneAwarePromise['resolve'] = ZoneAwarePromise.resolve;
    ZoneAwarePromise['reject'] = ZoneAwarePromise.reject;
    ZoneAwarePromise['race'] = ZoneAwarePromise.race;
    ZoneAwarePromise['all'] = ZoneAwarePromise.all;
    var NativePromise = global[__symbol__('Promise')] = global.Promise;
    global.Promise = ZoneAwarePromise;
    function patchThen(NativePromise) {
        var NativePromiseProtototype = NativePromise.prototype;
        var NativePromiseThen = NativePromiseProtototype[__symbol__('then')]
            = NativePromiseProtototype.then;
        NativePromiseProtototype.then = function (onResolve, onReject) {
            var nativePromise = this;
            return new ZoneAwarePromise(function (resolve, reject) {
                NativePromiseThen.call(nativePromise, resolve, reject);
            }).then(onResolve, onReject);
        };
    }
    if (NativePromise) {
        patchThen(NativePromise);
        if (typeof global['fetch'] !== 'undefined') {
            var fetchPromise = void 0;
            try {
                // In MS Edge this throws
                fetchPromise = global['fetch']();
            }
            catch (e) {
                // In Chrome this throws instead.
                fetchPromise = global['fetch']('about:blank');
            }
            // ignore output to prevent error;
            fetchPromise.then(function () { return null; }, function () { return null; });
            if (fetchPromise.constructor != NativePromise) {
                patchThen(fetchPromise.constructor);
            }
        }
    }
    // This is not part of public API, but it is usefull for tests, so we expose it.
    Promise[Zone.__symbol__('uncaughtPromiseErrors')] = _uncaughtPromiseErrors;
    return global.Zone = Zone;
})(typeof window === 'object' && window || typeof self === 'object' && self || global);

/**
 * Suppress closure compiler errors about unknown 'process' variable
 * @fileoverview
 * @suppress {undefinedVars}
 */
var zoneSymbol = Zone['__symbol__'];
var _global$1 = typeof window === 'object' && window || typeof self === 'object' && self || global;
function bindArguments(args, source) {
    for (var i = args.length - 1; i >= 0; i--) {
        if (typeof args[i] === 'function') {
            args[i] = Zone.current.wrap(args[i], source + '_' + i);
        }
    }
    return args;
}

function patchPrototype(prototype, fnNames) {
    var source = prototype.constructor['name'];
    var _loop_1 = function(i) {
        var name_1 = fnNames[i];
        var delegate = prototype[name_1];
        if (delegate) {
            prototype[name_1] = (function (delegate) {
                return function () {
                    return delegate.apply(this, bindArguments(arguments, source + '.' + name_1));
                };
            })(delegate);
        }
    };
    for (var i = 0; i < fnNames.length; i++) {
        _loop_1(i);
    }
}

var isWebWorker = (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope);
var isNode = (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]');
var isBrowser = !isNode && !isWebWorker && !!(typeof window !== 'undefined' && window['HTMLElement']);
function patchProperty(obj, prop) {
    var desc = Object.getOwnPropertyDescriptor(obj, prop) || {
        enumerable: true,
        configurable: true
    };
    // A property descriptor cannot have getter/setter and be writable
    // deleting the writable and value properties avoids this error:
    //
    // TypeError: property descriptors must not specify a value or be writable when a
    // getter or setter has been specified
    delete desc.writable;
    delete desc.value;
    // substr(2) cuz 'onclick' -> 'click', etc
    var eventName = prop.substr(2);
    var _prop = '_' + prop;
    desc.set = function (fn) {
        if (this[_prop]) {
            this.removeEventListener(eventName, this[_prop]);
        }
        if (typeof fn === 'function') {
            var wrapFn = function (event) {
                var result;
                result = fn.apply(this, arguments);
                if (result != undefined && !result)
                    event.preventDefault();
            };
            this[_prop] = wrapFn;
            this.addEventListener(eventName, wrapFn, false);
        }
        else {
            this[_prop] = null;
        }
    };
    // The getter would return undefined for unassigned properties but the default value of an unassigned property is null
    desc.get = function () {
        return this[_prop] || null;
    };
    Object.defineProperty(obj, prop, desc);
}

function patchOnProperties(obj, properties) {
    var onProperties = [];
    for (var prop in obj) {
        if (prop.substr(0, 2) == 'on') {
            onProperties.push(prop);
        }
    }
    for (var j = 0; j < onProperties.length; j++) {
        patchProperty(obj, onProperties[j]);
    }
    if (properties) {
        for (var i = 0; i < properties.length; i++) {
            patchProperty(obj, 'on' + properties[i]);
        }
    }
}

var EVENT_TASKS = zoneSymbol('eventTasks');
// For EventTarget
var ADD_EVENT_LISTENER = 'addEventListener';
var REMOVE_EVENT_LISTENER = 'removeEventListener';
function findExistingRegisteredTask(target, handler, name, capture, remove) {
    var eventTasks = target[EVENT_TASKS];
    if (eventTasks) {
        for (var i = 0; i < eventTasks.length; i++) {
            var eventTask = eventTasks[i];
            var data = eventTask.data;
            if (data.handler === handler
                && data.useCapturing === capture
                && data.eventName === name) {
                if (remove) {
                    eventTasks.splice(i, 1);
                }
                return eventTask;
            }
        }
    }
    return null;
}
function attachRegisteredEvent(target, eventTask) {
    var eventTasks = target[EVENT_TASKS];
    if (!eventTasks) {
        eventTasks = target[EVENT_TASKS] = [];
    }
    eventTasks.push(eventTask);
}
function makeZoneAwareAddListener(addFnName, removeFnName, useCapturingParam, allowDuplicates) {
    if (useCapturingParam === void 0) { useCapturingParam = true; }
    if (allowDuplicates === void 0) { allowDuplicates = false; }
    var addFnSymbol = zoneSymbol(addFnName);
    var removeFnSymbol = zoneSymbol(removeFnName);
    var defaultUseCapturing = useCapturingParam ? false : undefined;
    function scheduleEventListener(eventTask) {
        var meta = eventTask.data;
        attachRegisteredEvent(meta.target, eventTask);
        return meta.target[addFnSymbol](meta.eventName, eventTask.invoke, meta.useCapturing);
    }
    function cancelEventListener(eventTask) {
        var meta = eventTask.data;
        findExistingRegisteredTask(meta.target, eventTask.invoke, meta.eventName, meta.useCapturing, true);
        meta.target[removeFnSymbol](meta.eventName, eventTask.invoke, meta.useCapturing);
    }
    return function zoneAwareAddListener(self, args) {
        var eventName = args[0];
        var handler = args[1];
        var useCapturing = args[2] || defaultUseCapturing;
        // - Inside a Web Worker, `this` is undefined, the context is `global`
        // - When `addEventListener` is called on the global context in strict mode, `this` is undefined
        // see https://github.com/angular/zone.js/issues/190
        var target = self || _global$1;
        var delegate = null;
        if (typeof handler == 'function') {
            delegate = handler;
        }
        else if (handler && handler.handleEvent) {
            delegate = function (event) { return handler.handleEvent(event); };
        }
        var validZoneHandler = false;
        try {
            // In cross site contexts (such as WebDriver frameworks like Selenium),
            // accessing the handler object here will cause an exception to be thrown which
            // will fail tests prematurely.
            validZoneHandler = handler && handler.toString() === "[object FunctionWrapper]";
        }
        catch (e) {
            // Returning nothing here is fine, because objects in a cross-site context are unusable
            return;
        }
        // Ignore special listeners of IE11 & Edge dev tools, see https://github.com/angular/zone.js/issues/150
        if (!delegate || validZoneHandler) {
            return target[addFnSymbol](eventName, handler, useCapturing);
        }
        if (!allowDuplicates) {
            var eventTask = findExistingRegisteredTask(target, handler, eventName, useCapturing, false);
            if (eventTask) {
                // we already registered, so this will have noop.
                return target[addFnSymbol](eventName, eventTask.invoke, useCapturing);
            }
        }
        var zone = Zone.current;
        var source = target.constructor['name'] + '.' + addFnName + ':' + eventName;
        var data = {
            target: target,
            eventName: eventName,
            name: eventName,
            useCapturing: useCapturing,
            handler: handler
        };
        zone.scheduleEventTask(source, delegate, data, scheduleEventListener, cancelEventListener);
    };
}
function makeZoneAwareRemoveListener(fnName, useCapturingParam) {
    if (useCapturingParam === void 0) { useCapturingParam = true; }
    var symbol = zoneSymbol(fnName);
    var defaultUseCapturing = useCapturingParam ? false : undefined;
    return function zoneAwareRemoveListener(self, args) {
        var eventName = args[0];
        var handler = args[1];
        var useCapturing = args[2] || defaultUseCapturing;
        // - Inside a Web Worker, `this` is undefined, the context is `global`
        // - When `addEventListener` is called on the global context in strict mode, `this` is undefined
        // see https://github.com/angular/zone.js/issues/190
        var target = self || _global$1;
        var eventTask = findExistingRegisteredTask(target, handler, eventName, useCapturing, true);
        if (eventTask) {
            eventTask.zone.cancelTask(eventTask);
        }
        else {
            target[symbol](eventName, handler, useCapturing);
        }
    };
}

var zoneAwareAddEventListener = makeZoneAwareAddListener(ADD_EVENT_LISTENER, REMOVE_EVENT_LISTENER);
var zoneAwareRemoveEventListener = makeZoneAwareRemoveListener(REMOVE_EVENT_LISTENER);
function patchEventTargetMethods(obj) {
    if (obj && obj.addEventListener) {
        patchMethod(obj, ADD_EVENT_LISTENER, function () { return zoneAwareAddEventListener; });
        patchMethod(obj, REMOVE_EVENT_LISTENER, function () { return zoneAwareRemoveEventListener; });
        return true;
    }
    else {
        return false;
    }
}
var originalInstanceKey = zoneSymbol('originalInstance');
// wrap some native API on `window`
function patchClass(className) {
    var OriginalClass = _global$1[className];
    if (!OriginalClass)
        return;
    _global$1[className] = function () {
        var a = bindArguments(arguments, className);
        switch (a.length) {
            case 0:
                this[originalInstanceKey] = new OriginalClass();
                break;
            case 1:
                this[originalInstanceKey] = new OriginalClass(a[0]);
                break;
            case 2:
                this[originalInstanceKey] = new OriginalClass(a[0], a[1]);
                break;
            case 3:
                this[originalInstanceKey] = new OriginalClass(a[0], a[1], a[2]);
                break;
            case 4:
                this[originalInstanceKey] = new OriginalClass(a[0], a[1], a[2], a[3]);
                break;
            default: throw new Error('Arg list too long.');
        }
    };
    var instance = new OriginalClass(function () { });
    var prop;
    for (prop in instance) {
        // https://bugs.webkit.org/show_bug.cgi?id=44721
        if (className === 'XMLHttpRequest' && prop === 'responseBlob')
            continue;
        (function (prop) {
            if (typeof instance[prop] === 'function') {
                _global$1[className].prototype[prop] = function () {
                    return this[originalInstanceKey][prop].apply(this[originalInstanceKey], arguments);
                };
            }
            else {
                Object.defineProperty(_global$1[className].prototype, prop, {
                    set: function (fn) {
                        if (typeof fn === 'function') {
                            this[originalInstanceKey][prop] = Zone.current.wrap(fn, className + '.' + prop);
                        }
                        else {
                            this[originalInstanceKey][prop] = fn;
                        }
                    },
                    get: function () {
                        return this[originalInstanceKey][prop];
                    }
                });
            }
        }(prop));
    }
    for (prop in OriginalClass) {
        if (prop !== 'prototype' && OriginalClass.hasOwnProperty(prop)) {
            _global$1[className][prop] = OriginalClass[prop];
        }
    }
}

function createNamedFn(name, delegate) {
    try {
        return (Function('f', "return function " + name + "(){return f(this, arguments)}"))(delegate);
    }
    catch (e) {
        // if we fail, we must be CSP, just return delegate.
        return function () {
            return delegate(this, arguments);
        };
    }
}
function patchMethod(target, name, patchFn) {
    var proto = target;
    while (proto && !proto.hasOwnProperty(name)) {
        proto = Object.getPrototypeOf(proto);
    }
    if (!proto && target[name]) {
        // somehow we did not find it, but we can see it. This happens on IE for Window properties.
        proto = target;
    }
    var delegateName = zoneSymbol(name);
    var delegate;
    if (proto && !(delegate = proto[delegateName])) {
        delegate = proto[delegateName] = proto[name];
        proto[name] = createNamedFn(name, patchFn(delegate, delegateName, name));
    }
    return delegate;
}

var WTF_ISSUE_555 = 'Anchor,Area,Audio,BR,Base,BaseFont,Body,Button,Canvas,Content,DList,Directory,Div,Embed,FieldSet,Font,Form,Frame,FrameSet,HR,Head,Heading,Html,IFrame,Image,Input,Keygen,LI,Label,Legend,Link,Map,Marquee,Media,Menu,Meta,Meter,Mod,OList,Object,OptGroup,Option,Output,Paragraph,Pre,Progress,Quote,Script,Select,Source,Span,Style,TableCaption,TableCell,TableCol,Table,TableRow,TableSection,TextArea,Title,Track,UList,Unknown,Video';
var NO_EVENT_TARGET = 'ApplicationCache,EventSource,FileReader,InputMethodContext,MediaController,MessagePort,Node,Performance,SVGElementInstance,SharedWorker,TextTrack,TextTrackCue,TextTrackList,WebKitNamedFlow,Window,Worker,WorkerGlobalScope,XMLHttpRequest,XMLHttpRequestEventTarget,XMLHttpRequestUpload,IDBRequest,IDBOpenDBRequest,IDBDatabase,IDBTransaction,IDBCursor,DBIndex'.split(',');
var EVENT_TARGET = 'EventTarget';
function eventTargetPatch(_global) {
    var apis = [];
    var isWtf = _global['wtf'];
    if (isWtf) {
        // Workaround for: https://github.com/google/tracing-framework/issues/555
        apis = WTF_ISSUE_555.split(',').map(function (v) { return 'HTML' + v + 'Element'; }).concat(NO_EVENT_TARGET);
    }
    else if (_global[EVENT_TARGET]) {
        apis.push(EVENT_TARGET);
    }
    else {
        // Note: EventTarget is not available in all browsers,
        // if it's not available, we instead patch the APIs in the IDL that inherit from EventTarget
        apis = NO_EVENT_TARGET;
    }
    for (var i = 0; i < apis.length; i++) {
        var type = _global[apis[i]];
        patchEventTargetMethods(type && type.prototype);
    }
}

/*
 * This is necessary for Chrome and Chrome mobile, to enable
 * things like redefining `createdCallback` on an element.
 */
var _defineProperty = Object[zoneSymbol('defineProperty')] = Object.defineProperty;
var _getOwnPropertyDescriptor = Object[zoneSymbol('getOwnPropertyDescriptor')] = Object.getOwnPropertyDescriptor;
var _create = Object.create;
var unconfigurablesKey = zoneSymbol('unconfigurables');
function propertyPatch() {
    Object.defineProperty = function (obj, prop, desc) {
        if (isUnconfigurable(obj, prop)) {
            throw new TypeError('Cannot assign to read only property \'' + prop + '\' of ' + obj);
        }
        var originalConfigurableFlag = desc.configurable;
        if (prop !== 'prototype') {
            desc = rewriteDescriptor(obj, prop, desc);
        }
        return _tryDefineProperty(obj, prop, desc, originalConfigurableFlag);
    };
    Object.defineProperties = function (obj, props) {
        Object.keys(props).forEach(function (prop) {
            Object.defineProperty(obj, prop, props[prop]);
        });
        return obj;
    };
    Object.create = function (obj, proto) {
        if (typeof proto === 'object' && !Object.isFrozen(proto)) {
            Object.keys(proto).forEach(function (prop) {
                proto[prop] = rewriteDescriptor(obj, prop, proto[prop]);
            });
        }
        return _create(obj, proto);
    };
    Object.getOwnPropertyDescriptor = function (obj, prop) {
        var desc = _getOwnPropertyDescriptor(obj, prop);
        if (isUnconfigurable(obj, prop)) {
            desc.configurable = false;
        }
        return desc;
    };
}

function _redefineProperty(obj, prop, desc) {
    var originalConfigurableFlag = desc.configurable;
    desc = rewriteDescriptor(obj, prop, desc);
    return _tryDefineProperty(obj, prop, desc, originalConfigurableFlag);
}

function isUnconfigurable(obj, prop) {
    return obj && obj[unconfigurablesKey] && obj[unconfigurablesKey][prop];
}
function rewriteDescriptor(obj, prop, desc) {
    desc.configurable = true;
    if (!desc.configurable) {
        if (!obj[unconfigurablesKey]) {
            _defineProperty(obj, unconfigurablesKey, { writable: true, value: {} });
        }
        obj[unconfigurablesKey][prop] = true;
    }
    return desc;
}
function _tryDefineProperty(obj, prop, desc, originalConfigurableFlag) {
    try {
        return _defineProperty(obj, prop, desc);
    }
    catch (e) {
        if (desc.configurable) {
            // In case of errors, when the configurable flag was likely set by rewriteDescriptor(), let's retry with the original flag value
            if (typeof originalConfigurableFlag == 'undefined') {
                delete desc.configurable;
            }
            else {
                desc.configurable = originalConfigurableFlag;
            }
            try {
                return _defineProperty(obj, prop, desc);
            }
            catch (e) {
                var descJson = null;
                try {
                    descJson = JSON.stringify(desc);
                }
                catch (e) {
                    descJson = descJson.toString();
                }
                console.log("Attempting to configure '" + prop + "' with descriptor '" + descJson + "' on object '" + obj + "' and got error, giving up: " + e);
            }
        }
        else {
            throw e;
        }
    }
}

function registerElementPatch(_global) {
    if (!isBrowser || !('registerElement' in _global.document)) {
        return;
    }
    var _registerElement = document.registerElement;
    var callbacks = [
        'createdCallback',
        'attachedCallback',
        'detachedCallback',
        'attributeChangedCallback'
    ];
    document.registerElement = function (name, opts) {
        if (opts && opts.prototype) {
            callbacks.forEach(function (callback) {
                var source = 'Document.registerElement::' + callback;
                if (opts.prototype.hasOwnProperty(callback)) {
                    var descriptor = Object.getOwnPropertyDescriptor(opts.prototype, callback);
                    if (descriptor && descriptor.value) {
                        descriptor.value = Zone.current.wrap(descriptor.value, source);
                        _redefineProperty(opts.prototype, callback, descriptor);
                    }
                    else {
                        opts.prototype[callback] = Zone.current.wrap(opts.prototype[callback], source);
                    }
                }
                else if (opts.prototype[callback]) {
                    opts.prototype[callback] = Zone.current.wrap(opts.prototype[callback], source);
                }
            });
        }
        return _registerElement.apply(document, [name, opts]);
    };
}

// we have to patch the instance since the proto is non-configurable
function apply(_global) {
    var WS = _global.WebSocket;
    // On Safari window.EventTarget doesn't exist so need to patch WS add/removeEventListener
    // On older Chrome, no need since EventTarget was already patched
    if (!_global.EventTarget) {
        patchEventTargetMethods(WS.prototype);
    }
    _global.WebSocket = function (a, b) {
        var socket = arguments.length > 1 ? new WS(a, b) : new WS(a);
        var proxySocket;
        // Safari 7.0 has non-configurable own 'onmessage' and friends properties on the socket instance
        var onmessageDesc = Object.getOwnPropertyDescriptor(socket, 'onmessage');
        if (onmessageDesc && onmessageDesc.configurable === false) {
            proxySocket = Object.create(socket);
            ['addEventListener', 'removeEventListener', 'send', 'close'].forEach(function (propName) {
                proxySocket[propName] = function () {
                    return socket[propName].apply(socket, arguments);
                };
            });
        }
        else {
            // we can patch the real socket
            proxySocket = socket;
        }
        patchOnProperties(proxySocket, ['close', 'error', 'message', 'open']);
        return proxySocket;
    };
    for (var prop in WS) {
        _global.WebSocket[prop] = WS[prop];
    }
}

var eventNames = 'copy cut paste abort blur focus canplay canplaythrough change click contextmenu dblclick drag dragend dragenter dragleave dragover dragstart drop durationchange emptied ended input invalid keydown keypress keyup load loadeddata loadedmetadata loadstart message mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup pause play playing progress ratechange reset scroll seeked seeking select show stalled submit suspend timeupdate volumechange waiting mozfullscreenchange mozfullscreenerror mozpointerlockchange mozpointerlockerror error webglcontextrestored webglcontextlost webglcontextcreationerror'.split(' ');
function propertyDescriptorPatch(_global) {
    if (isNode) {
        return;
    }
    var supportsWebSocket = typeof WebSocket !== 'undefined';
    if (canPatchViaPropertyDescriptor()) {
        // for browsers that we can patch the descriptor:  Chrome & Firefox
        if (isBrowser) {
            patchOnProperties(HTMLElement.prototype, eventNames);
        }
        patchOnProperties(XMLHttpRequest.prototype, null);
        if (typeof IDBIndex !== 'undefined') {
            patchOnProperties(IDBIndex.prototype, null);
            patchOnProperties(IDBRequest.prototype, null);
            patchOnProperties(IDBOpenDBRequest.prototype, null);
            patchOnProperties(IDBDatabase.prototype, null);
            patchOnProperties(IDBTransaction.prototype, null);
            patchOnProperties(IDBCursor.prototype, null);
        }
        if (supportsWebSocket) {
            patchOnProperties(WebSocket.prototype, null);
        }
    }
    else {
        // Safari, Android browsers (Jelly Bean)
        patchViaCapturingAllTheEvents();
        patchClass('XMLHttpRequest');
        if (supportsWebSocket) {
            apply(_global);
        }
    }
}
function canPatchViaPropertyDescriptor() {
    if (isBrowser && !Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'onclick')
        && typeof Element !== 'undefined') {
        // WebKit https://bugs.webkit.org/show_bug.cgi?id=134364
        // IDL interface attributes are not configurable
        var desc = Object.getOwnPropertyDescriptor(Element.prototype, 'onclick');
        if (desc && !desc.configurable)
            return false;
    }
    Object.defineProperty(XMLHttpRequest.prototype, 'onreadystatechange', {
        get: function () {
            return true;
        }
    });
    var req = new XMLHttpRequest();
    var result = !!req.onreadystatechange;
    Object.defineProperty(XMLHttpRequest.prototype, 'onreadystatechange', {});
    return result;
}

var unboundKey = zoneSymbol('unbound');
// Whenever any eventListener fires, we check the eventListener target and all parents
// for `onwhatever` properties and replace them with zone-bound functions
// - Chrome (for now)
function patchViaCapturingAllTheEvents() {
    var _loop_1 = function(i) {
        var property = eventNames[i];
        var onproperty = 'on' + property;
        document.addEventListener(property, function (event) {
            var elt = event.target, bound, source;
            if (elt) {
                source = elt.constructor['name'] + '.' + onproperty;
            }
            else {
                source = 'unknown.' + onproperty;
            }
            while (elt) {
                if (elt[onproperty] && !elt[onproperty][unboundKey]) {
                    bound = Zone.current.wrap(elt[onproperty], source);
                    bound[unboundKey] = elt[onproperty];
                    elt[onproperty] = bound;
                }
                elt = elt.parentElement;
            }
        }, true);
    };
    for (var i = 0; i < eventNames.length; i++) {
        _loop_1(i);
    }
    
}

function patchTimer(window, setName, cancelName, nameSuffix) {
    var setNative = null;
    var clearNative = null;
    setName += nameSuffix;
    cancelName += nameSuffix;
    function scheduleTask(task) {
        var data = task.data;
        data.args[0] = task.invoke;
        data.handleId = setNative.apply(window, data.args);
        return task;
    }
    function clearTask(task) {
        return clearNative(task.data.handleId);
    }
    setNative = patchMethod(window, setName, function (delegate) { return function (self, args) {
        if (typeof args[0] === 'function') {
            var zone = Zone.current;
            var options = {
                handleId: null,
                isPeriodic: nameSuffix === 'Interval',
                delay: (nameSuffix === 'Timeout' || nameSuffix === 'Interval') ? args[1] || 0 : null,
                args: args
            };
            var task = zone.scheduleMacroTask(setName, args[0], options, scheduleTask, clearTask);
            if (!task) {
                return task;
            }
            // Node.js must additionally support the ref and unref functions.
            var handle = task.data.handleId;
            if (handle.ref && handle.unref) {
                task.ref = handle.ref.bind(handle);
                task.unref = handle.unref.bind(handle);
            }
            return task;
        }
        else {
            // cause an error by calling it directly.
            return delegate.apply(window, args);
        }
    }; });
    clearNative = patchMethod(window, cancelName, function (delegate) { return function (self, args) {
        var task = args[0];
        if (task && typeof task.type === 'string') {
            if (task.cancelFn && task.data.isPeriodic || task.runCount === 0) {
                // Do not cancel already canceled functions
                task.zone.cancelTask(task);
            }
        }
        else {
            // cause an error by calling it directly.
            delegate.apply(window, args);
        }
    }; });
}

var set = 'set';
var clear = 'clear';
var blockingMethods = ['alert', 'prompt', 'confirm'];
var _global = typeof window === 'object' && window || typeof self === 'object' && self || global;
patchTimer(_global, set, clear, 'Timeout');
patchTimer(_global, set, clear, 'Interval');
patchTimer(_global, set, clear, 'Immediate');
patchTimer(_global, 'request', 'cancel', 'AnimationFrame');
patchTimer(_global, 'mozRequest', 'mozCancel', 'AnimationFrame');
patchTimer(_global, 'webkitRequest', 'webkitCancel', 'AnimationFrame');
for (var i = 0; i < blockingMethods.length; i++) {
    var name = blockingMethods[i];
    patchMethod(_global, name, function (delegate, symbol, name) {
        return function (s, args) {
            return Zone.current.run(delegate, _global, args, name);
        };
    });
}
eventTargetPatch(_global);
propertyDescriptorPatch(_global);
patchClass('MutationObserver');
patchClass('WebKitMutationObserver');
patchClass('FileReader');
propertyPatch();
registerElementPatch(_global);
// Treat XMLHTTPRequest as a macrotask.
patchXHR(_global);
var XHR_TASK = zoneSymbol('xhrTask');
var XHR_SYNC = zoneSymbol('xhrSync');
function patchXHR(window) {
    function findPendingTask(target) {
        var pendingTask = target[XHR_TASK];
        return pendingTask;
    }
    function scheduleTask(task) {
        var data = task.data;
        data.target.addEventListener('readystatechange', function () {
            if (data.target.readyState === data.target.DONE) {
                if (!data.aborted) {
                    task.invoke();
                }
            }
        });
        var storedTask = data.target[XHR_TASK];
        if (!storedTask) {
            data.target[XHR_TASK] = task;
        }
        sendNative.apply(data.target, data.args);
        return task;
    }
    function placeholderCallback() {
    }
    function clearTask(task) {
        var data = task.data;
        // Note - ideally, we would call data.target.removeEventListener here, but it's too late
        // to prevent it from firing. So instead, we store info for the event listener.
        data.aborted = true;
        return abortNative.apply(data.target, data.args);
    }
    var openNative = patchMethod(window.XMLHttpRequest.prototype, 'open', function () { return function (self, args) {
        self[XHR_SYNC] = args[2] == false;
        return openNative.apply(self, args);
    }; });
    var sendNative = patchMethod(window.XMLHttpRequest.prototype, 'send', function () { return function (self, args) {
        var zone = Zone.current;
        if (self[XHR_SYNC]) {
            // if the XHR is sync there is no task to schedule, just execute the code.
            return sendNative.apply(self, args);
        }
        else {
            var options = {
                target: self,
                isPeriodic: false,
                delay: null,
                args: args,
                aborted: false
            };
            return zone.scheduleMacroTask('XMLHttpRequest.send', placeholderCallback, options, scheduleTask, clearTask);
        }
    }; });
    var abortNative = patchMethod(window.XMLHttpRequest.prototype, 'abort', function (delegate) { return function (self, args) {
        var task = findPendingTask(self);
        if (task && typeof task.type == 'string') {
            // If the XHR has already completed, do nothing.
            if (task.cancelFn == null) {
                return;
            }
            task.zone.cancelTask(task);
        }
        // Otherwise, we are trying to abort an XHR which has not yet been sent, so there is no task to cancel. Do nothing.
    }; });
}
/// GEO_LOCATION
if (_global['navigator'] && _global['navigator'].geolocation) {
    patchPrototype(_global['navigator'].geolocation, [
        'getCurrentPosition',
        'watchPosition'
    ]);
}

})));

/*! *****************************************************************************
Copyright (C) Microsoft. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
var Reflect;
(function (Reflect) {
    "use strict";
    var hasOwn = Object.prototype.hasOwnProperty;
    // feature test for Object.create support
    var supportsCreate = typeof Object.create === "function";
    // feature test for __proto__ support
    var supportsProto = (function () {
        var sentinel = {};
        function __() { }
        __.prototype = sentinel;
        var instance = new __();
        return instance.__proto__ === sentinel;
    })();
    // create an object in dictionary mode (a.k.a. "slow" mode in v8)
    var createDictionary = supportsCreate ? function () { return MakeDictionary(Object.create(null)); } :
        supportsProto ? function () { return MakeDictionary({ __proto__: null }); } :
            function () { return MakeDictionary({}); };
    var HashMap;
    (function (HashMap) {
        var downLevel = !supportsCreate && !supportsProto;
        HashMap.has = downLevel
            ? function (map, key) { return hasOwn.call(map, key); }
            : function (map, key) { return key in map; };
        HashMap.get = downLevel
            ? function (map, key) { return hasOwn.call(map, key) ? map[key] : undefined; }
            : function (map, key) { return map[key]; };
    })(HashMap || (HashMap = {}));
    // Load global or shim versions of Map, Set, and WeakMap
    var functionPrototype = Object.getPrototypeOf(Function);
    var _Map = typeof Map === "function" ? Map : CreateMapPolyfill();
    var _Set = typeof Set === "function" ? Set : CreateSetPolyfill();
    var _WeakMap = typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
    // [[Metadata]] internal slot
    var Metadata = new _WeakMap();
    /**
      * Applies a set of decorators to a property of a target object.
      * @param decorators An array of decorators.
      * @param target The target object.
      * @param targetKey (Optional) The property key to decorate.
      * @param targetDescriptor (Optional) The property descriptor for the target key
      * @remarks Decorators are applied in reverse order.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     Example = Reflect.decorate(decoratorsArray, Example);
      *
      *     // property (on constructor)
      *     Reflect.decorate(decoratorsArray, Example, "staticProperty");
      *
      *     // property (on prototype)
      *     Reflect.decorate(decoratorsArray, Example.prototype, "property");
      *
      *     // method (on constructor)
      *     Object.defineProperty(Example, "staticMethod",
      *         Reflect.decorate(decoratorsArray, Example, "staticMethod",
      *             Object.getOwnPropertyDescriptor(Example, "staticMethod")));
      *
      *     // method (on prototype)
      *     Object.defineProperty(Example.prototype, "method",
      *         Reflect.decorate(decoratorsArray, Example.prototype, "method",
      *             Object.getOwnPropertyDescriptor(Example.prototype, "method")));
      *
      */
    function decorate(decorators, target, targetKey, targetDescriptor) {
        if (!IsUndefined(targetDescriptor)) {
            if (!IsArray(decorators))
                throw new TypeError();
            if (!IsObject(target))
                throw new TypeError();
            if (IsUndefined(targetKey))
                throw new TypeError();
            if (!IsObject(targetDescriptor))
                throw new TypeError();
            targetKey = ToPropertyKey(targetKey);
            return DecoratePropertyWithDescriptor(decorators, target, targetKey, targetDescriptor);
        }
        else if (!IsUndefined(targetKey)) {
            if (!IsArray(decorators))
                throw new TypeError();
            if (!IsObject(target))
                throw new TypeError();
            targetKey = ToPropertyKey(targetKey);
            return DecoratePropertyWithoutDescriptor(decorators, target, targetKey);
        }
        else {
            if (!IsArray(decorators))
                throw new TypeError();
            if (!IsConstructor(target))
                throw new TypeError();
            return DecorateConstructor(decorators, target);
        }
    }
    Reflect.decorate = decorate;
    /**
      * A default metadata decorator factory that can be used on a class, class member, or parameter.
      * @param metadataKey The key for the metadata entry.
      * @param metadataValue The value for the metadata entry.
      * @returns A decorator function.
      * @remarks
      * If `metadataKey` is already defined for the target and target key, the
      * metadataValue for that key will be overwritten.
      * @example
      *
      *     // constructor
      *     @Reflect.metadata(key, value)
      *     class Example {
      *     }
      *
      *     // property (on constructor, TypeScript only)
      *     class Example {
      *         @Reflect.metadata(key, value)
      *         static staticProperty;
      *     }
      *
      *     // property (on prototype, TypeScript only)
      *     class Example {
      *         @Reflect.metadata(key, value)
      *         property;
      *     }
      *
      *     // method (on constructor)
      *     class Example {
      *         @Reflect.metadata(key, value)
      *         static staticMethod() { }
      *     }
      *
      *     // method (on prototype)
      *     class Example {
      *         @Reflect.metadata(key, value)
      *         method() { }
      *     }
      *
      */
    function metadata(metadataKey, metadataValue) {
        function decorator(target, targetKey) {
            if (!IsUndefined(targetKey)) {
                if (!IsObject(target))
                    throw new TypeError();
                targetKey = ToPropertyKey(targetKey);
                OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, targetKey);
            }
            else {
                if (!IsConstructor(target))
                    throw new TypeError();
                OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, /*targetKey*/ undefined);
            }
        }
        return decorator;
    }
    Reflect.metadata = metadata;
    /**
      * Define a unique metadata entry on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadataValue A value that contains attached metadata.
      * @param target The target object on which to define metadata.
      * @param targetKey (Optional) The property key for the target.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     Reflect.defineMetadata("custom:annotation", options, Example);
      *
      *     // property (on constructor)
      *     Reflect.defineMetadata("custom:annotation", options, Example, "staticProperty");
      *
      *     // property (on prototype)
      *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "property");
      *
      *     // method (on constructor)
      *     Reflect.defineMetadata("custom:annotation", options, Example, "staticMethod");
      *
      *     // method (on prototype)
      *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "method");
      *
      *     // decorator factory as metadata-producing annotation.
      *     function MyAnnotation(options): Decorator {
      *         return (target, key?) => Reflect.defineMetadata("custom:annotation", options, target, key);
      *     }
      *
      */
    function defineMetadata(metadataKey, metadataValue, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, targetKey);
    }
    Reflect.defineMetadata = defineMetadata;
    /**
      * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.hasMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.hasMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.hasMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function hasMetadata(metadataKey, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryHasMetadata(metadataKey, target, targetKey);
    }
    Reflect.hasMetadata = hasMetadata;
    /**
      * Gets a value indicating whether the target object has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function hasOwnMetadata(metadataKey, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryHasOwnMetadata(metadataKey, target, targetKey);
    }
    Reflect.hasOwnMetadata = hasOwnMetadata;
    /**
      * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.getMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.getMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function getMetadata(metadataKey, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryGetMetadata(metadataKey, target, targetKey);
    }
    Reflect.getMetadata = getMetadata;
    /**
      * Gets the metadata value for the provided metadata key on the target object.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.getOwnMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function getOwnMetadata(metadataKey, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryGetOwnMetadata(metadataKey, target, targetKey);
    }
    Reflect.getOwnMetadata = getOwnMetadata;
    /**
      * Gets the metadata keys defined on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.getMetadataKeys(Example);
      *
      *     // property (on constructor)
      *     result = Reflect.getMetadataKeys(Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getMetadataKeys(Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getMetadataKeys(Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getMetadataKeys(Example.prototype, "method");
      *
      */
    function getMetadataKeys(target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryMetadataKeys(target, targetKey);
    }
    Reflect.getMetadataKeys = getMetadataKeys;
    /**
      * Gets the unique metadata keys defined on the target object.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.getOwnMetadataKeys(Example);
      *
      *     // property (on constructor)
      *     result = Reflect.getOwnMetadataKeys(Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getOwnMetadataKeys(Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getOwnMetadataKeys(Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getOwnMetadataKeys(Example.prototype, "method");
      *
      */
    function getOwnMetadataKeys(target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryOwnMetadataKeys(target, targetKey);
    }
    Reflect.getOwnMetadataKeys = getOwnMetadataKeys;
    /**
      * Deletes the metadata entry from the target object with the provided key.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns `true` if the metadata entry was found and deleted; otherwise, false.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.deleteMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function deleteMetadata(metadataKey, target, targetKey) {
        // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#deletemetadata-metadatakey-p-
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        var metadataMap = GetOrCreateMetadataMap(target, targetKey, /*create*/ false);
        if (IsUndefined(metadataMap))
            return false;
        if (!metadataMap.delete(metadataKey))
            return false;
        if (metadataMap.size > 0)
            return true;
        var targetMetadata = Metadata.get(target);
        targetMetadata.delete(targetKey);
        if (targetMetadata.size > 0)
            return true;
        Metadata.delete(target);
        return true;
    }
    Reflect.deleteMetadata = deleteMetadata;
    function DecorateConstructor(decorators, target) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target);
            if (!IsUndefined(decorated)) {
                if (!IsConstructor(decorated))
                    throw new TypeError();
                target = decorated;
            }
        }
        return target;
    }
    function DecoratePropertyWithDescriptor(decorators, target, propertyKey, descriptor) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target, propertyKey, descriptor);
            if (!IsUndefined(decorated)) {
                if (!IsObject(decorated))
                    throw new TypeError();
                descriptor = decorated;
            }
        }
        return descriptor;
    }
    function DecoratePropertyWithoutDescriptor(decorators, target, propertyKey) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            decorator(target, propertyKey);
        }
    }
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#getorcreatemetadatamap--o-p-create-
    function GetOrCreateMetadataMap(target, targetKey, create) {
        var targetMetadata = Metadata.get(target);
        if (!targetMetadata) {
            if (!create)
                return undefined;
            targetMetadata = new _Map();
            Metadata.set(target, targetMetadata);
        }
        var keyMetadata = targetMetadata.get(targetKey);
        if (!keyMetadata) {
            if (!create)
                return undefined;
            keyMetadata = new _Map();
            targetMetadata.set(targetKey, keyMetadata);
        }
        return keyMetadata;
    }
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinaryhasmetadata--metadatakey-o-p-
    function OrdinaryHasMetadata(MetadataKey, O, P) {
        var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
        if (hasOwn)
            return true;
        var parent = GetPrototypeOf(O);
        return parent !== null ? OrdinaryHasMetadata(MetadataKey, parent, P) : false;
    }
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinaryhasownmetadata--metadatakey-o-p-
    function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
        var metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ false);
        return metadataMap !== undefined && Boolean(metadataMap.has(MetadataKey));
    }
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinarygetmetadata--metadatakey-o-p-
    function OrdinaryGetMetadata(MetadataKey, O, P) {
        var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
        if (hasOwn)
            return OrdinaryGetOwnMetadata(MetadataKey, O, P);
        var parent = GetPrototypeOf(O);
        return parent !== null ? OrdinaryGetMetadata(MetadataKey, parent, P) : undefined;
    }
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinarygetownmetadata--metadatakey-o-p-
    function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
        var metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ false);
        return metadataMap === undefined ? undefined : metadataMap.get(MetadataKey);
    }
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinarydefineownmetadata--metadatakey-metadatavalue-o-p-
    function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
        var metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ true);
        metadataMap.set(MetadataKey, MetadataValue);
    }
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinarymetadatakeys--o-p-
    function OrdinaryMetadataKeys(O, P) {
        var ownKeys = OrdinaryOwnMetadataKeys(O, P);
        var parent = GetPrototypeOf(O);
        if (parent === null)
            return ownKeys;
        var parentKeys = OrdinaryMetadataKeys(parent, P);
        if (parentKeys.length <= 0)
            return ownKeys;
        if (ownKeys.length <= 0)
            return parentKeys;
        var keys = new _Set();
        for (var _i = 0; _i < ownKeys.length; _i++) {
            var key = ownKeys[_i];
            keys.add(key);
        }
        for (var _a = 0; _a < parentKeys.length; _a++) {
            var key = parentKeys[_a];
            keys.add(key);
        }
        return getKeys(keys);
    }
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinaryownmetadatakeys--o-p-
    function OrdinaryOwnMetadataKeys(target, targetKey) {
        var metadataMap = GetOrCreateMetadataMap(target, targetKey, /*create*/ false);
        var keys = [];
        if (metadataMap)
            forEach(metadataMap, function (_, key) { return keys.push(key); });
        return keys;
    }
    // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-ecmascript-language-types-undefined-type
    function IsUndefined(x) {
        return x === undefined;
    }
    // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isarray
    function IsArray(x) {
        return Array.isArray ? Array.isArray(x) : x instanceof Array || Object.prototype.toString.call(x) === "[object Array]";
    }
    // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object-type
    function IsObject(x) {
        return typeof x === "object" ? x !== null : typeof x === "function";
    }
    // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isconstructor
    function IsConstructor(x) {
        return typeof x === "function";
    }
    // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-ecmascript-language-types-symbol-type
    function IsSymbol(x) {
        return typeof x === "symbol";
    }
    // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-topropertykey
    function ToPropertyKey(value) {
        return IsSymbol(value) ? value : String(value);
    }
    function GetPrototypeOf(O) {
        var proto = Object.getPrototypeOf(O);
        if (typeof O !== "function" || O === functionPrototype)
            return proto;
        // TypeScript doesn't set __proto__ in ES5, as it's non-standard.
        // Try to determine the superclass Exampleonstructor. Compatible implementations
        // must either set __proto__ on a subclass Exampleonstructor to the superclass Exampleonstructor,
        // or ensure each class has a valid `constructor` property on its prototype that
        // points back to the constructor.
        // If this is not the same as Function.[[Prototype]], then this is definately inherited.
        // This is the case when in ES6 or when using __proto__ in a compatible browser.
        if (proto !== functionPrototype)
            return proto;
        // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
        var prototype = O.prototype;
        var prototypeProto = prototype && Object.getPrototypeOf(prototype);
        if (prototypeProto == null || prototypeProto === Object.prototype)
            return proto;
        // If the constructor was not a function, then we cannot determine the heritage.
        var constructor = prototypeProto.constructor;
        if (typeof constructor !== "function")
            return proto;
        // If we have some kind of self-reference, then we cannot determine the heritage.
        if (constructor === O)
            return proto;
        // we have a pretty good guess at the heritage.
        return constructor;
    }
    function IteratorStep(iterator) {
        var result = iterator.next();
        return result.done ? undefined : result;
    }
    function IteratorClose(iterator) {
        var f = iterator["return"];
        if (f)
            f.call(iterator);
    }
    function forEach(source, callback, thisArg) {
        var entries = source.entries;
        if (typeof entries === "function") {
            var iterator = entries.call(source);
            var result;
            try {
                while (result = IteratorStep(iterator)) {
                    var _a = result.value, key = _a[0], value = _a[1];
                    callback.call(thisArg, value, key, source);
                }
            }
            finally {
                if (result)
                    IteratorClose(iterator);
            }
        }
        else {
            var forEach_1 = source.forEach;
            if (typeof forEach_1 === "function") {
                forEach_1.call(source, callback, thisArg);
            }
        }
    }
    function getKeys(source) {
        var keys = [];
        forEach(source, function (_, key) { keys.push(key); });
        return keys;
    }
    // naive MapIterator shim
    function CreateMapIterator(keys, values, kind) {
        var index = 0;
        return {
            next: function () {
                if ((keys || values) && index < (keys || values).length) {
                    var current = index++;
                    switch (kind) {
                        case "key": return { value: keys[current], done: false };
                        case "value": return { value: values[current], done: false };
                        case "key+value": return { value: [keys[current], values[current]], done: false };
                    }
                }
                keys = undefined;
                values = undefined;
                return { value: undefined, done: true };
            },
            "throw": function (error) {
                if (keys || values) {
                    keys = undefined;
                    values = undefined;
                }
                throw error;
            },
            "return": function (value) {
                if (keys || values) {
                    keys = undefined;
                    values = undefined;
                }
                return { value: value, done: true };
            }
        };
    }
    // naive Map shim
    function CreateMapPolyfill() {
        var cacheSentinel = {};
        return (function () {
            function Map() {
                this._keys = [];
                this._values = [];
                this._cacheKey = cacheSentinel;
                this._cacheIndex = -2;
            }
            Object.defineProperty(Map.prototype, "size", {
                get: function () { return this._keys.length; },
                enumerable: true,
                configurable: true
            });
            Map.prototype.has = function (key) { return this._find(key, /*insert*/ false) >= 0; };
            Map.prototype.get = function (key) {
                var index = this._find(key, /*insert*/ false);
                return index >= 0 ? this._values[index] : undefined;
            };
            Map.prototype.set = function (key, value) {
                var index = this._find(key, /*insert*/ true);
                this._values[index] = value;
                return this;
            };
            Map.prototype.delete = function (key) {
                var index = this._find(key, /*insert*/ false);
                if (index >= 0) {
                    var size = this._keys.length;
                    for (var i = index + 1; i < size; i++) {
                        this._keys[i - 1] = this._keys[i];
                        this._values[i - 1] = this._values[i];
                    }
                    this._keys.length--;
                    this._values.length--;
                    this._cacheKey = cacheSentinel;
                    this._cacheIndex = -2;
                    return true;
                }
                return false;
            };
            Map.prototype.clear = function () {
                this._keys.length = 0;
                this._values.length = 0;
                this._cacheKey = cacheSentinel;
                this._cacheIndex = -2;
            };
            Map.prototype.keys = function () { return CreateMapIterator(this._keys, /*values*/ undefined, "key"); };
            Map.prototype.values = function () { return CreateMapIterator(/*keys*/ undefined, this._values, "value"); };
            Map.prototype.entries = function () { return CreateMapIterator(this._keys, this._values, "key+value"); };
            Map.prototype._find = function (key, insert) {
                if (this._cacheKey === key)
                    return this._cacheIndex;
                var index = this._keys.indexOf(key);
                if (index < 0 && insert) {
                    index = this._keys.length;
                    this._keys.push(key);
                    this._values.push(undefined);
                }
                return this._cacheKey = key, this._cacheIndex = index;
            };
            return Map;
        })();
    }
    // naive Set shim
    function CreateSetPolyfill() {
        return (function () {
            function Set() {
                this._map = new _Map();
            }
            Object.defineProperty(Set.prototype, "size", {
                get: function () { return this._map.size; },
                enumerable: true,
                configurable: true
            });
            Set.prototype.has = function (value) { return this._map.has(value); };
            Set.prototype.add = function (value) { return this._map.set(value, value), this; };
            Set.prototype.delete = function (value) { return this._map.delete(value); };
            Set.prototype.clear = function () { this._map.clear(); };
            Set.prototype.keys = function () { return this._map.keys(); };
            Set.prototype.values = function () { return this._map.values(); };
            Set.prototype.entries = function () { return this._map.entries(); };
            return Set;
        })();
    }
    // naive WeakMap shim
    function CreateWeakMapPolyfill() {
        var UUID_SIZE = 16;
        var keys = createDictionary();
        var rootKey = CreateUniqueKey();
        return (function () {
            function WeakMap() {
                this._key = CreateUniqueKey();
            }
            WeakMap.prototype.has = function (target) {
                var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                return table !== undefined ? HashMap.has(table, this._key) : false;
            };
            WeakMap.prototype.get = function (target) {
                var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                return table !== undefined ? HashMap.get(table, this._key) : undefined;
            };
            WeakMap.prototype.set = function (target, value) {
                var table = GetOrCreateWeakMapTable(target, /*create*/ true);
                table[this._key] = value;
                return this;
            };
            WeakMap.prototype.delete = function (target) {
                var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                return table !== undefined ? delete table[this._key] : false;
            };
            WeakMap.prototype.clear = function () {
                // NOTE: not a real clear, just makes the previous data unreachable
                this._key = CreateUniqueKey();
            };
            return WeakMap;
        })();
        function FillRandomBytes(buffer, size) {
            for (var i = 0; i < size; ++i)
                buffer[i] = Math.random() * 0xff | 0;
            return buffer;
        }
        function GenRandomBytes(size) {
            if (typeof Uint8Array === "function") {
                if (typeof crypto !== "undefined")
                    return crypto.getRandomValues(new Uint8Array(size));
                if (typeof msCrypto !== "undefined")
                    return msCrypto.getRandomValues(new Uint8Array(size));
                return FillRandomBytes(new Uint8Array(size), size);
            }
            return FillRandomBytes(new Array(size), size);
        }
        function CreateUUID() {
            var data = GenRandomBytes(UUID_SIZE);
            // mark as random - RFC 4122 § 4.4
            data[6] = data[6] & 0x4f | 0x40;
            data[8] = data[8] & 0xbf | 0x80;
            var result = "";
            for (var offset = 0; offset < UUID_SIZE; ++offset) {
                var byte = data[offset];
                if (offset === 4 || offset === 6 || offset === 8)
                    result += "-";
                if (byte < 16)
                    result += "0";
                result += byte.toString(16).toLowerCase();
            }
            return result;
        }
        function CreateUniqueKey() {
            var key;
            do
                key = "@@WeakMap@@" + CreateUUID();
            while (HashMap.has(keys, key));
            keys[key] = true;
            return key;
        }
        function GetOrCreateWeakMapTable(target, create) {
            if (!hasOwn.call(target, rootKey)) {
                if (!create)
                    return undefined;
                Object.defineProperty(target, rootKey, { value: createDictionary() });
            }
            return target[rootKey];
        }
    }
    // uses a heuristic used by v8 and chakra to force an object into dictionary mode.
    function MakeDictionary(obj) {
        obj.__DICTIONARY_MODE__ = 1;
        delete obj.____DICTIONARY_MODE__;
        return obj;
    }
    // patch global Reflect
    (function (__global) {
        if (typeof __global.Reflect !== "undefined") {
            if (__global.Reflect !== Reflect) {
                for (var p in Reflect) {
                    if (hasOwn.call(Reflect, p)) {
                        __global.Reflect[p] = Reflect[p];
                    }
                }
            }
        }
        else {
            __global.Reflect = Reflect;
        }
    })(typeof window !== "undefined" ? window :
        typeof WorkerGlobalScope !== "undefined" ? self :
            typeof global !== "undefined" ? global :
                Function("return this;")());
})(Reflect || (Reflect = {}));
//# sourceMappingURL=Reflect.js.map
/**
  @license
                                 Apache License
                         Version 2.0, January 2004
                      http://www.apache.org/licenses/

 TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

 1. Definitions.

    "License" shall mean the terms and conditions for use, reproduction,
    and distribution as defined by Sections 1 through 9 of this document.

    "Licensor" shall mean the copyright owner or entity authorized by
    the copyright owner that is granting the License.

    "Legal Entity" shall mean the union of the acting entity and all
    other entities that control, are controlled by, or are under common
    control with that entity. For the purposes of this definition,
    "control" means (i) the power, direct or indirect, to cause the
    direction or management of such entity, whether by contract or
    otherwise, or (ii) ownership of fifty percent (50%) or more of the
    outstanding shares, or (iii) beneficial ownership of such entity.

    "You" (or "Your") shall mean an individual or Legal Entity
    exercising permissions granted by this License.

    "Source" form shall mean the preferred form for making modifications,
    including but not limited to software source code, documentation
    source, and configuration files.

    "Object" form shall mean any form resulting from mechanical
    transformation or translation of a Source form, including but
    not limited to compiled object code, generated documentation,
    and conversions to other media types.

    "Work" shall mean the work of authorship, whether in Source or
    Object form, made available under the License, as indicated by a
    copyright notice that is included in or attached to the work
    (an example is provided in the Appendix below).

    "Derivative Works" shall mean any work, whether in Source or Object
    form, that is based on (or derived from) the Work and for which the
    editorial revisions, annotations, elaborations, or other modifications
    represent, as a whole, an original work of authorship. For the purposes
    of this License, Derivative Works shall not include works that remain
    separable from, or merely link (or bind by name) to the interfaces of,
    the Work and Derivative Works thereof.

    "Contribution" shall mean any work of authorship, including
    the original version of the Work and any modifications or additions
    to that Work or Derivative Works thereof, that is intentionally
    submitted to Licensor for inclusion in the Work by the copyright owner
    or by an individual or Legal Entity authorized to submit on behalf of
    the copyright owner. For the purposes of this definition, "submitted"
    means any form of electronic, verbal, or written communication sent
    to the Licensor or its representatives, including but not limited to
    communication on electronic mailing lists, source code control systems,
    and issue tracking systems that are managed by, or on behalf of, the
    Licensor for the purpose of discussing and improving the Work, but
    excluding communication that is conspicuously marked or otherwise
    designated in writing by the copyright owner as "Not a Contribution."

    "Contributor" shall mean Licensor and any individual or Legal Entity
    on behalf of whom a Contribution has been received by Licensor and
    subsequently incorporated within the Work.

 2. Grant of Copyright License. Subject to the terms and conditions of
    this License, each Contributor hereby grants to You a perpetual,
    worldwide, non-exclusive, no-charge, royalty-free, irrevocable
    copyright license to reproduce, prepare Derivative Works of,
    publicly display, publicly perform, sublicense, and distribute the
    Work and such Derivative Works in Source or Object form.

 3. Grant of Patent License. Subject to the terms and conditions of
    this License, each Contributor hereby grants to You a perpetual,
    worldwide, non-exclusive, no-charge, royalty-free, irrevocable
    (except as stated in this section) patent license to make, have made,
    use, offer to sell, sell, import, and otherwise transfer the Work,
    where such license applies only to those patent claims licensable
    by such Contributor that are necessarily infringed by their
    Contribution(s) alone or by combination of their Contribution(s)
    with the Work to which such Contribution(s) was submitted. If You
    institute patent litigation against any entity (including a
    cross-claim or counterclaim in a lawsuit) alleging that the Work
    or a Contribution incorporated within the Work constitutes direct
    or contributory patent infringement, then any patent licenses
    granted to You under this License for that Work shall terminate
    as of the date such litigation is filed.

 4. Redistribution. You may reproduce and distribute copies of the
    Work or Derivative Works thereof in any medium, with or without
    modifications, and in Source or Object form, provided that You
    meet the following conditions:

    (a) You must give any other recipients of the Work or
        Derivative Works a copy of this License; and

    (b) You must cause any modified files to carry prominent notices
        stating that You changed the files; and

    (c) You must retain, in the Source form of any Derivative Works
        that You distribute, all copyright, patent, trademark, and
        attribution notices from the Source form of the Work,
        excluding those notices that do not pertain to any part of
        the Derivative Works; and

    (d) If the Work includes a "NOTICE" text file as part of its
        distribution, then any Derivative Works that You distribute must
        include a readable copy of the attribution notices contained
        within such NOTICE file, excluding those notices that do not
        pertain to any part of the Derivative Works, in at least one
        of the following places: within a NOTICE text file distributed
        as part of the Derivative Works; within the Source form or
        documentation, if provided along with the Derivative Works; or,
        within a display generated by the Derivative Works, if and
        wherever such third-party notices normally appear. The contents
        of the NOTICE file are for informational purposes only and
        do not modify the License. You may add Your own attribution
        notices within Derivative Works that You distribute, alongside
        or as an addendum to the NOTICE text from the Work, provided
        that such additional attribution notices cannot be construed
        as modifying the License.

    You may add Your own copyright statement to Your modifications and
    may provide additional or different license terms and conditions
    for use, reproduction, or distribution of Your modifications, or
    for any such Derivative Works as a whole, provided Your use,
    reproduction, and distribution of the Work otherwise complies with
    the conditions stated in this License.

 5. Submission of Contributions. Unless You explicitly state otherwise,
    any Contribution intentionally submitted for inclusion in the Work
    by You to the Licensor shall be under the terms and conditions of
    this License, without any additional terms or conditions.
    Notwithstanding the above, nothing herein shall supersede or modify
    the terms of any separate license agreement you may have executed
    with Licensor regarding such Contributions.

 6. Trademarks. This License does not grant permission to use the trade
    names, trademarks, service marks, or product names of the Licensor,
    except as required for reasonable and customary use in describing the
    origin of the Work and reproducing the content of the NOTICE file.

 7. Disclaimer of Warranty. Unless required by applicable law or
    agreed to in writing, Licensor provides the Work (and each
    Contributor provides its Contributions) on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
    implied, including, without limitation, any warranties or conditions
    of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
    PARTICULAR PURPOSE. You are solely responsible for determining the
    appropriateness of using or redistributing the Work and assume any
    risks associated with Your exercise of permissions under this License.

 8. Limitation of Liability. In no event and under no legal theory,
    whether in tort (including negligence), contract, or otherwise,
    unless required by applicable law (such as deliberate and grossly
    negligent acts) or agreed to in writing, shall any Contributor be
    liable to You for damages, including any direct, indirect, special,
    incidental, or consequential damages of any character arising as a
    result of this License or out of the use or inability to use the
    Work (including but not limited to damages for loss of goodwill,
    work stoppage, computer failure or malfunction, or any and all
    other commercial damages or losses), even if such Contributor
    has been advised of the possibility of such damages.

 9. Accepting Warranty or Additional Liability. While redistributing
    the Work or Derivative Works thereof, You may choose to offer,
    and charge a fee for, acceptance of support, warranty, indemnity,
    or other liability obligations and/or rights consistent with this
    License. However, in accepting such obligations, You may act only
    on Your own behalf and on Your sole responsibility, not on behalf
    of any other Contributor, and only if You agree to indemnify,
    defend, and hold each Contributor harmless for any liability
    incurred by, or claims asserted against, such Contributor by reason
    of your accepting any such warranty or additional liability.

 END OF TERMS AND CONDITIONS

 APPENDIX: How to apply the Apache License to your work.

    To apply the Apache License to your work, attach the following
    boilerplate notice, with the fields enclosed by brackets "[]"
    replaced with your own identifying information. (Don't include
    the brackets!)  The text should be enclosed in the appropriate
    comment syntax for the file format. We also recommend that a
    file or class name and description of purpose be included on the
    same "printed page" as the copyright notice for easier
    identification within third-party archives.

 Copyright 2015-2016 Netflix, Inc., Microsoft Corp. and contributors

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 **/
"format register";
System.register("rxjs/util/root", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };
  exports.root = (objectTypes[typeof self] && self) || (objectTypes[typeof window] && window);
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    exports.root = freeGlobal;
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/symbol/observable", ["rxjs/util/root"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var root_1 = require("rxjs/util/root");
  var Symbol = root_1.root.Symbol;
  if (typeof Symbol === 'function') {
    if (Symbol.observable) {
      exports.$$observable = Symbol.observable;
    } else {
      if (typeof Symbol.for === 'function') {
        exports.$$observable = Symbol.for('observable');
      } else {
        exports.$$observable = Symbol('observable');
      }
      Symbol.observable = exports.$$observable;
    }
  } else {
    exports.$$observable = '@@observable';
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/isFunction", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  function isFunction(x) {
    return typeof x === 'function';
  }
  exports.isFunction = isFunction;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/isArray", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  exports.isArray = Array.isArray || (function(x) {
    return x && typeof x.length === 'number';
  });
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/isObject", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  function isObject(x) {
    return x != null && typeof x === 'object';
  }
  exports.isObject = isObject;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/errorObject", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  exports.errorObject = {e: {}};
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/UnsubscriptionError", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var UnsubscriptionError = (function(_super) {
    __extends(UnsubscriptionError, _super);
    function UnsubscriptionError(errors) {
      _super.call(this);
      this.errors = errors;
      this.name = 'UnsubscriptionError';
      this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function(err, i) {
        return ((i + 1) + ") " + err.toString());
      }).join('\n') : '';
    }
    return UnsubscriptionError;
  }(Error));
  exports.UnsubscriptionError = UnsubscriptionError;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/symbol/rxSubscriber", ["rxjs/util/root"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var root_1 = require("rxjs/util/root");
  var Symbol = root_1.root.Symbol;
  exports.$$rxSubscriber = (typeof Symbol === 'function' && typeof Symbol.for === 'function') ? Symbol.for('rxSubscriber') : '@@rxSubscriber';
  global.define = __define;
  return module.exports;
});

System.register("rxjs/Observer", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  exports.empty = {
    isUnsubscribed: true,
    next: function(value) {},
    error: function(err) {
      throw err;
    },
    complete: function() {}
  };
  global.define = __define;
  return module.exports;
});

System.register("rxjs/SubjectSubscription", ["rxjs/Subscription"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscription_1 = require("rxjs/Subscription");
  var SubjectSubscription = (function(_super) {
    __extends(SubjectSubscription, _super);
    function SubjectSubscription(subject, observer) {
      _super.call(this);
      this.subject = subject;
      this.observer = observer;
      this.isUnsubscribed = false;
    }
    SubjectSubscription.prototype.unsubscribe = function() {
      if (this.isUnsubscribed) {
        return ;
      }
      this.isUnsubscribed = true;
      var subject = this.subject;
      var observers = subject.observers;
      this.subject = null;
      if (!observers || observers.length === 0 || subject.isUnsubscribed) {
        return ;
      }
      var subscriberIndex = observers.indexOf(this.observer);
      if (subscriberIndex !== -1) {
        observers.splice(subscriberIndex, 1);
      }
    };
    return SubjectSubscription;
  }(Subscription_1.Subscription));
  exports.SubjectSubscription = SubjectSubscription;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/throwError", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  function throwError(e) {
    throw e;
  }
  exports.throwError = throwError;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/ObjectUnsubscribedError", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var ObjectUnsubscribedError = (function(_super) {
    __extends(ObjectUnsubscribedError, _super);
    function ObjectUnsubscribedError() {
      _super.call(this, 'object unsubscribed');
      this.name = 'ObjectUnsubscribedError';
    }
    return ObjectUnsubscribedError;
  }(Error));
  exports.ObjectUnsubscribedError = ObjectUnsubscribedError;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/AsyncSubject", ["rxjs/Subject"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subject_1 = require("rxjs/Subject");
  var AsyncSubject = (function(_super) {
    __extends(AsyncSubject, _super);
    function AsyncSubject() {
      _super.apply(this, arguments);
      this.value = null;
      this.hasNext = false;
    }
    AsyncSubject.prototype._subscribe = function(subscriber) {
      if (this.hasCompleted && this.hasNext) {
        subscriber.next(this.value);
      }
      return _super.prototype._subscribe.call(this, subscriber);
    };
    AsyncSubject.prototype._next = function(value) {
      this.value = value;
      this.hasNext = true;
    };
    AsyncSubject.prototype._complete = function() {
      var index = -1;
      var observers = this.observers;
      var len = observers.length;
      this.isUnsubscribed = true;
      if (this.hasNext) {
        while (++index < len) {
          var o = observers[index];
          o.next(this.value);
          o.complete();
        }
      } else {
        while (++index < len) {
          observers[index].complete();
        }
      }
      this.isUnsubscribed = false;
      this.unsubscribe();
    };
    return AsyncSubject;
  }(Subject_1.Subject));
  exports.AsyncSubject = AsyncSubject;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/BoundNodeCallbackObservable", ["rxjs/Observable", "rxjs/util/tryCatch", "rxjs/util/errorObject", "rxjs/AsyncSubject"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var tryCatch_1 = require("rxjs/util/tryCatch");
  var errorObject_1 = require("rxjs/util/errorObject");
  var AsyncSubject_1 = require("rxjs/AsyncSubject");
  var BoundNodeCallbackObservable = (function(_super) {
    __extends(BoundNodeCallbackObservable, _super);
    function BoundNodeCallbackObservable(callbackFunc, selector, args, scheduler) {
      _super.call(this);
      this.callbackFunc = callbackFunc;
      this.selector = selector;
      this.args = args;
      this.scheduler = scheduler;
    }
    BoundNodeCallbackObservable.create = function(callbackFunc, selector, scheduler) {
      if (selector === void 0) {
        selector = undefined;
      }
      return function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i - 0] = arguments[_i];
        }
        return new BoundNodeCallbackObservable(callbackFunc, selector, args, scheduler);
      };
    };
    BoundNodeCallbackObservable.prototype._subscribe = function(subscriber) {
      var callbackFunc = this.callbackFunc;
      var args = this.args;
      var scheduler = this.scheduler;
      var subject = this.subject;
      if (!scheduler) {
        if (!subject) {
          subject = this.subject = new AsyncSubject_1.AsyncSubject();
          var handler = function handlerFn() {
            var innerArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
              innerArgs[_i - 0] = arguments[_i];
            }
            var source = handlerFn.source;
            var selector = source.selector,
                subject = source.subject;
            var err = innerArgs.shift();
            if (err) {
              subject.error(err);
            } else if (selector) {
              var result_1 = tryCatch_1.tryCatch(selector).apply(this, innerArgs);
              if (result_1 === errorObject_1.errorObject) {
                subject.error(errorObject_1.errorObject.e);
              } else {
                subject.next(result_1);
                subject.complete();
              }
            } else {
              subject.next(innerArgs.length === 1 ? innerArgs[0] : innerArgs);
              subject.complete();
            }
          };
          handler.source = this;
          var result = tryCatch_1.tryCatch(callbackFunc).apply(this, args.concat(handler));
          if (result === errorObject_1.errorObject) {
            subject.error(errorObject_1.errorObject.e);
          }
        }
        return subject.subscribe(subscriber);
      } else {
        return scheduler.schedule(dispatch, 0, {
          source: this,
          subscriber: subscriber
        });
      }
    };
    return BoundNodeCallbackObservable;
  }(Observable_1.Observable));
  exports.BoundNodeCallbackObservable = BoundNodeCallbackObservable;
  function dispatch(state) {
    var self = this;
    var source = state.source,
        subscriber = state.subscriber;
    var callbackFunc = source.callbackFunc,
        args = source.args,
        scheduler = source.scheduler;
    var subject = source.subject;
    if (!subject) {
      subject = source.subject = new AsyncSubject_1.AsyncSubject();
      var handler = function handlerFn() {
        var innerArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          innerArgs[_i - 0] = arguments[_i];
        }
        var source = handlerFn.source;
        var selector = source.selector,
            subject = source.subject;
        var err = innerArgs.shift();
        if (err) {
          subject.error(err);
        } else if (selector) {
          var result_2 = tryCatch_1.tryCatch(selector).apply(this, innerArgs);
          if (result_2 === errorObject_1.errorObject) {
            self.add(scheduler.schedule(dispatchError, 0, {
              err: errorObject_1.errorObject.e,
              subject: subject
            }));
          } else {
            self.add(scheduler.schedule(dispatchNext, 0, {
              value: result_2,
              subject: subject
            }));
          }
        } else {
          var value = innerArgs.length === 1 ? innerArgs[0] : innerArgs;
          self.add(scheduler.schedule(dispatchNext, 0, {
            value: value,
            subject: subject
          }));
        }
      };
      handler.source = source;
      var result = tryCatch_1.tryCatch(callbackFunc).apply(this, args.concat(handler));
      if (result === errorObject_1.errorObject) {
        subject.error(errorObject_1.errorObject.e);
      }
    }
    self.add(subject.subscribe(subscriber));
  }
  function dispatchNext(arg) {
    var value = arg.value,
        subject = arg.subject;
    subject.next(value);
    subject.complete();
  }
  function dispatchError(arg) {
    var err = arg.err,
        subject = arg.subject;
    subject.error(err);
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/ScalarObservable", ["rxjs/Observable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var ScalarObservable = (function(_super) {
    __extends(ScalarObservable, _super);
    function ScalarObservable(value, scheduler) {
      _super.call(this);
      this.value = value;
      this.scheduler = scheduler;
      this._isScalar = true;
    }
    ScalarObservable.create = function(value, scheduler) {
      return new ScalarObservable(value, scheduler);
    };
    ScalarObservable.dispatch = function(state) {
      var done = state.done,
          value = state.value,
          subscriber = state.subscriber;
      if (done) {
        subscriber.complete();
        return ;
      }
      subscriber.next(value);
      if (subscriber.isUnsubscribed) {
        return ;
      }
      state.done = true;
      this.schedule(state);
    };
    ScalarObservable.prototype._subscribe = function(subscriber) {
      var value = this.value;
      var scheduler = this.scheduler;
      if (scheduler) {
        return scheduler.schedule(ScalarObservable.dispatch, 0, {
          done: false,
          value: value,
          subscriber: subscriber
        });
      } else {
        subscriber.next(value);
        if (!subscriber.isUnsubscribed) {
          subscriber.complete();
        }
      }
    };
    return ScalarObservable;
  }(Observable_1.Observable));
  exports.ScalarObservable = ScalarObservable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/EmptyObservable", ["rxjs/Observable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var EmptyObservable = (function(_super) {
    __extends(EmptyObservable, _super);
    function EmptyObservable(scheduler) {
      _super.call(this);
      this.scheduler = scheduler;
    }
    EmptyObservable.create = function(scheduler) {
      return new EmptyObservable(scheduler);
    };
    EmptyObservable.dispatch = function(arg) {
      var subscriber = arg.subscriber;
      subscriber.complete();
    };
    EmptyObservable.prototype._subscribe = function(subscriber) {
      var scheduler = this.scheduler;
      if (scheduler) {
        return scheduler.schedule(EmptyObservable.dispatch, 0, {subscriber: subscriber});
      } else {
        subscriber.complete();
      }
    };
    return EmptyObservable;
  }(Observable_1.Observable));
  exports.EmptyObservable = EmptyObservable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/isScheduler", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  function isScheduler(value) {
    return value && typeof value.schedule === 'function';
  }
  exports.isScheduler = isScheduler;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/OuterSubscriber", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var OuterSubscriber = (function(_super) {
    __extends(OuterSubscriber, _super);
    function OuterSubscriber() {
      _super.apply(this, arguments);
    }
    OuterSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.destination.next(innerValue);
    };
    OuterSubscriber.prototype.notifyError = function(error, innerSub) {
      this.destination.error(error);
    };
    OuterSubscriber.prototype.notifyComplete = function(innerSub) {
      this.destination.complete();
    };
    return OuterSubscriber;
  }(Subscriber_1.Subscriber));
  exports.OuterSubscriber = OuterSubscriber;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/isPromise", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  function isPromise(value) {
    return value && typeof value.subscribe !== 'function' && typeof value.then === 'function';
  }
  exports.isPromise = isPromise;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/symbol/iterator", ["rxjs/util/root"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var root_1 = require("rxjs/util/root");
  var Symbol = root_1.root.Symbol;
  if (typeof Symbol === 'function') {
    if (Symbol.iterator) {
      exports.$$iterator = Symbol.iterator;
    } else if (typeof Symbol.for === 'function') {
      exports.$$iterator = Symbol.for('iterator');
    }
  } else {
    if (root_1.root.Set && typeof new root_1.root.Set()['@@iterator'] === 'function') {
      exports.$$iterator = '@@iterator';
    } else if (root_1.root.Map) {
      var keys = Object.getOwnPropertyNames(root_1.root.Map.prototype);
      for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (key !== 'entries' && key !== 'size' && root_1.root.Map.prototype[key] === root_1.root.Map.prototype['entries']) {
          exports.$$iterator = key;
          break;
        }
      }
    } else {
      exports.$$iterator = '@@iterator';
    }
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/InnerSubscriber", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var InnerSubscriber = (function(_super) {
    __extends(InnerSubscriber, _super);
    function InnerSubscriber(parent, outerValue, outerIndex) {
      _super.call(this);
      this.parent = parent;
      this.outerValue = outerValue;
      this.outerIndex = outerIndex;
      this.index = 0;
    }
    InnerSubscriber.prototype._next = function(value) {
      this.parent.notifyNext(this.outerValue, value, this.outerIndex, this.index++, this);
    };
    InnerSubscriber.prototype._error = function(error) {
      this.parent.notifyError(error, this);
      this.unsubscribe();
    };
    InnerSubscriber.prototype._complete = function() {
      this.parent.notifyComplete(this);
      this.unsubscribe();
    };
    return InnerSubscriber;
  }(Subscriber_1.Subscriber));
  exports.InnerSubscriber = InnerSubscriber;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/mergeAll", ["rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function mergeAll(concurrent) {
    if (concurrent === void 0) {
      concurrent = Number.POSITIVE_INFINITY;
    }
    return this.lift(new MergeAllOperator(concurrent));
  }
  exports.mergeAll = mergeAll;
  var MergeAllOperator = (function() {
    function MergeAllOperator(concurrent) {
      this.concurrent = concurrent;
    }
    MergeAllOperator.prototype.call = function(observer, source) {
      return source._subscribe(new MergeAllSubscriber(observer, this.concurrent));
    };
    return MergeAllOperator;
  }());
  exports.MergeAllOperator = MergeAllOperator;
  var MergeAllSubscriber = (function(_super) {
    __extends(MergeAllSubscriber, _super);
    function MergeAllSubscriber(destination, concurrent) {
      _super.call(this, destination);
      this.concurrent = concurrent;
      this.hasCompleted = false;
      this.buffer = [];
      this.active = 0;
    }
    MergeAllSubscriber.prototype._next = function(observable) {
      if (this.active < this.concurrent) {
        this.active++;
        this.add(subscribeToResult_1.subscribeToResult(this, observable));
      } else {
        this.buffer.push(observable);
      }
    };
    MergeAllSubscriber.prototype._complete = function() {
      this.hasCompleted = true;
      if (this.active === 0 && this.buffer.length === 0) {
        this.destination.complete();
      }
    };
    MergeAllSubscriber.prototype.notifyComplete = function(innerSub) {
      var buffer = this.buffer;
      this.remove(innerSub);
      this.active--;
      if (buffer.length > 0) {
        this._next(buffer.shift());
      } else if (this.active === 0 && this.hasCompleted) {
        this.destination.complete();
      }
    };
    return MergeAllSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  exports.MergeAllSubscriber = MergeAllSubscriber;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/DeferObservable", ["rxjs/Observable", "rxjs/util/subscribeToResult", "rxjs/OuterSubscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var DeferObservable = (function(_super) {
    __extends(DeferObservable, _super);
    function DeferObservable(observableFactory) {
      _super.call(this);
      this.observableFactory = observableFactory;
    }
    DeferObservable.create = function(observableFactory) {
      return new DeferObservable(observableFactory);
    };
    DeferObservable.prototype._subscribe = function(subscriber) {
      return new DeferSubscriber(subscriber, this.observableFactory);
    };
    return DeferObservable;
  }(Observable_1.Observable));
  exports.DeferObservable = DeferObservable;
  var DeferSubscriber = (function(_super) {
    __extends(DeferSubscriber, _super);
    function DeferSubscriber(destination, factory) {
      _super.call(this, destination);
      this.factory = factory;
      this.tryDefer();
    }
    DeferSubscriber.prototype.tryDefer = function() {
      try {
        this._callFactory();
      } catch (err) {
        this._error(err);
      }
    };
    DeferSubscriber.prototype._callFactory = function() {
      var result = this.factory();
      if (result) {
        this.add(subscribeToResult_1.subscribeToResult(this, result));
      }
    };
    return DeferSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/empty", ["rxjs/observable/EmptyObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var EmptyObservable_1 = require("rxjs/observable/EmptyObservable");
  exports.empty = EmptyObservable_1.EmptyObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/ForkJoinObservable", ["rxjs/Observable", "rxjs/observable/EmptyObservable", "rxjs/util/isArray", "rxjs/util/subscribeToResult", "rxjs/OuterSubscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var EmptyObservable_1 = require("rxjs/observable/EmptyObservable");
  var isArray_1 = require("rxjs/util/isArray");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var ForkJoinObservable = (function(_super) {
    __extends(ForkJoinObservable, _super);
    function ForkJoinObservable(sources, resultSelector) {
      _super.call(this);
      this.sources = sources;
      this.resultSelector = resultSelector;
    }
    ForkJoinObservable.create = function() {
      var sources = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i - 0] = arguments[_i];
      }
      if (sources === null || arguments.length === 0) {
        return new EmptyObservable_1.EmptyObservable();
      }
      var resultSelector = null;
      if (typeof sources[sources.length - 1] === 'function') {
        resultSelector = sources.pop();
      }
      if (sources.length === 1 && isArray_1.isArray(sources[0])) {
        sources = sources[0];
      }
      if (sources.length === 0) {
        return new EmptyObservable_1.EmptyObservable();
      }
      return new ForkJoinObservable(sources, resultSelector);
    };
    ForkJoinObservable.prototype._subscribe = function(subscriber) {
      return new ForkJoinSubscriber(subscriber, this.sources, this.resultSelector);
    };
    return ForkJoinObservable;
  }(Observable_1.Observable));
  exports.ForkJoinObservable = ForkJoinObservable;
  var ForkJoinSubscriber = (function(_super) {
    __extends(ForkJoinSubscriber, _super);
    function ForkJoinSubscriber(destination, sources, resultSelector) {
      _super.call(this, destination);
      this.sources = sources;
      this.resultSelector = resultSelector;
      this.completed = 0;
      this.haveValues = 0;
      var len = sources.length;
      this.total = len;
      this.values = new Array(len);
      for (var i = 0; i < len; i++) {
        var source = sources[i];
        var innerSubscription = subscribeToResult_1.subscribeToResult(this, source, null, i);
        if (innerSubscription) {
          innerSubscription.outerIndex = i;
          this.add(innerSubscription);
        }
      }
    }
    ForkJoinSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.values[outerIndex] = innerValue;
      if (!innerSub._hasValue) {
        innerSub._hasValue = true;
        this.haveValues++;
      }
    };
    ForkJoinSubscriber.prototype.notifyComplete = function(innerSub) {
      var destination = this.destination;
      var _a = this,
          haveValues = _a.haveValues,
          resultSelector = _a.resultSelector,
          values = _a.values;
      var len = values.length;
      if (!innerSub._hasValue) {
        destination.complete();
        return ;
      }
      this.completed++;
      if (this.completed !== len) {
        return ;
      }
      if (haveValues === len) {
        var value = resultSelector ? resultSelector.apply(this, values) : values;
        destination.next(value);
      }
      destination.complete();
    };
    return ForkJoinSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/PromiseObservable", ["rxjs/util/root", "rxjs/Observable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var root_1 = require("rxjs/util/root");
  var Observable_1 = require("rxjs/Observable");
  var PromiseObservable = (function(_super) {
    __extends(PromiseObservable, _super);
    function PromiseObservable(promise, scheduler) {
      if (scheduler === void 0) {
        scheduler = null;
      }
      _super.call(this);
      this.promise = promise;
      this.scheduler = scheduler;
    }
    PromiseObservable.create = function(promise, scheduler) {
      if (scheduler === void 0) {
        scheduler = null;
      }
      return new PromiseObservable(promise, scheduler);
    };
    PromiseObservable.prototype._subscribe = function(subscriber) {
      var _this = this;
      var promise = this.promise;
      var scheduler = this.scheduler;
      if (scheduler == null) {
        if (this._isScalar) {
          if (!subscriber.isUnsubscribed) {
            subscriber.next(this.value);
            subscriber.complete();
          }
        } else {
          promise.then(function(value) {
            _this.value = value;
            _this._isScalar = true;
            if (!subscriber.isUnsubscribed) {
              subscriber.next(value);
              subscriber.complete();
            }
          }, function(err) {
            if (!subscriber.isUnsubscribed) {
              subscriber.error(err);
            }
          }).then(null, function(err) {
            root_1.root.setTimeout(function() {
              throw err;
            });
          });
        }
      } else {
        if (this._isScalar) {
          if (!subscriber.isUnsubscribed) {
            return scheduler.schedule(dispatchNext, 0, {
              value: this.value,
              subscriber: subscriber
            });
          }
        } else {
          promise.then(function(value) {
            _this.value = value;
            _this._isScalar = true;
            if (!subscriber.isUnsubscribed) {
              subscriber.add(scheduler.schedule(dispatchNext, 0, {
                value: value,
                subscriber: subscriber
              }));
            }
          }, function(err) {
            if (!subscriber.isUnsubscribed) {
              subscriber.add(scheduler.schedule(dispatchError, 0, {
                err: err,
                subscriber: subscriber
              }));
            }
          }).then(null, function(err) {
            root_1.root.setTimeout(function() {
              throw err;
            });
          });
        }
      }
    };
    return PromiseObservable;
  }(Observable_1.Observable));
  exports.PromiseObservable = PromiseObservable;
  function dispatchNext(arg) {
    var value = arg.value,
        subscriber = arg.subscriber;
    if (!subscriber.isUnsubscribed) {
      subscriber.next(value);
      subscriber.complete();
    }
  }
  function dispatchError(arg) {
    var err = arg.err,
        subscriber = arg.subscriber;
    if (!subscriber.isUnsubscribed) {
      subscriber.error(err);
    }
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/IteratorObservable", ["rxjs/util/root", "rxjs/util/isObject", "rxjs/util/tryCatch", "rxjs/Observable", "rxjs/util/isFunction", "rxjs/symbol/iterator", "rxjs/util/errorObject"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var root_1 = require("rxjs/util/root");
  var isObject_1 = require("rxjs/util/isObject");
  var tryCatch_1 = require("rxjs/util/tryCatch");
  var Observable_1 = require("rxjs/Observable");
  var isFunction_1 = require("rxjs/util/isFunction");
  var iterator_1 = require("rxjs/symbol/iterator");
  var errorObject_1 = require("rxjs/util/errorObject");
  var IteratorObservable = (function(_super) {
    __extends(IteratorObservable, _super);
    function IteratorObservable(iterator, project, thisArg, scheduler) {
      _super.call(this);
      if (iterator == null) {
        throw new Error('iterator cannot be null.');
      }
      if (isObject_1.isObject(project)) {
        this.thisArg = project;
        this.scheduler = thisArg;
      } else if (isFunction_1.isFunction(project)) {
        this.project = project;
        this.thisArg = thisArg;
        this.scheduler = scheduler;
      } else if (project != null) {
        throw new Error('When provided, `project` must be a function.');
      }
      this.iterator = getIterator(iterator);
    }
    IteratorObservable.create = function(iterator, project, thisArg, scheduler) {
      return new IteratorObservable(iterator, project, thisArg, scheduler);
    };
    IteratorObservable.dispatch = function(state) {
      var index = state.index,
          hasError = state.hasError,
          thisArg = state.thisArg,
          project = state.project,
          iterator = state.iterator,
          subscriber = state.subscriber;
      if (hasError) {
        subscriber.error(state.error);
        return ;
      }
      var result = iterator.next();
      if (result.done) {
        subscriber.complete();
        return ;
      }
      if (project) {
        result = tryCatch_1.tryCatch(project).call(thisArg, result.value, index);
        if (result === errorObject_1.errorObject) {
          state.error = errorObject_1.errorObject.e;
          state.hasError = true;
        } else {
          subscriber.next(result);
          state.index = index + 1;
        }
      } else {
        subscriber.next(result.value);
        state.index = index + 1;
      }
      if (subscriber.isUnsubscribed) {
        return ;
      }
      this.schedule(state);
    };
    IteratorObservable.prototype._subscribe = function(subscriber) {
      var index = 0;
      var _a = this,
          iterator = _a.iterator,
          project = _a.project,
          thisArg = _a.thisArg,
          scheduler = _a.scheduler;
      if (scheduler) {
        return scheduler.schedule(IteratorObservable.dispatch, 0, {
          index: index,
          thisArg: thisArg,
          project: project,
          iterator: iterator,
          subscriber: subscriber
        });
      } else {
        do {
          var result = iterator.next();
          if (result.done) {
            subscriber.complete();
            break;
          } else if (project) {
            result = tryCatch_1.tryCatch(project).call(thisArg, result.value, index++);
            if (result === errorObject_1.errorObject) {
              subscriber.error(errorObject_1.errorObject.e);
              break;
            }
            subscriber.next(result);
          } else {
            subscriber.next(result.value);
          }
          if (subscriber.isUnsubscribed) {
            break;
          }
        } while (true);
      }
    };
    return IteratorObservable;
  }(Observable_1.Observable));
  exports.IteratorObservable = IteratorObservable;
  var StringIterator = (function() {
    function StringIterator(str, idx, len) {
      if (idx === void 0) {
        idx = 0;
      }
      if (len === void 0) {
        len = str.length;
      }
      this.str = str;
      this.idx = idx;
      this.len = len;
    }
    StringIterator.prototype[iterator_1.$$iterator] = function() {
      return (this);
    };
    StringIterator.prototype.next = function() {
      return this.idx < this.len ? {
        done: false,
        value: this.str.charAt(this.idx++)
      } : {
        done: true,
        value: undefined
      };
    };
    return StringIterator;
  }());
  var ArrayIterator = (function() {
    function ArrayIterator(arr, idx, len) {
      if (idx === void 0) {
        idx = 0;
      }
      if (len === void 0) {
        len = toLength(arr);
      }
      this.arr = arr;
      this.idx = idx;
      this.len = len;
    }
    ArrayIterator.prototype[iterator_1.$$iterator] = function() {
      return this;
    };
    ArrayIterator.prototype.next = function() {
      return this.idx < this.len ? {
        done: false,
        value: this.arr[this.idx++]
      } : {
        done: true,
        value: undefined
      };
    };
    return ArrayIterator;
  }());
  function getIterator(obj) {
    var i = obj[iterator_1.$$iterator];
    if (!i && typeof obj === 'string') {
      return new StringIterator(obj);
    }
    if (!i && obj.length !== undefined) {
      return new ArrayIterator(obj);
    }
    if (!i) {
      throw new TypeError('Object is not iterable');
    }
    return obj[iterator_1.$$iterator]();
  }
  var maxSafeInteger = Math.pow(2, 53) - 1;
  function toLength(o) {
    var len = +o.length;
    if (isNaN(len)) {
      return 0;
    }
    if (len === 0 || !numberIsFinite(len)) {
      return len;
    }
    len = sign(len) * Math.floor(Math.abs(len));
    if (len <= 0) {
      return 0;
    }
    if (len > maxSafeInteger) {
      return maxSafeInteger;
    }
    return len;
  }
  function numberIsFinite(value) {
    return typeof value === 'number' && root_1.root.isFinite(value);
  }
  function sign(value) {
    var valueAsNumber = +value;
    if (valueAsNumber === 0) {
      return valueAsNumber;
    }
    if (isNaN(valueAsNumber)) {
      return valueAsNumber;
    }
    return valueAsNumber < 0 ? -1 : 1;
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/ArrayLikeObservable", ["rxjs/Observable", "rxjs/observable/ScalarObservable", "rxjs/observable/EmptyObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var ScalarObservable_1 = require("rxjs/observable/ScalarObservable");
  var EmptyObservable_1 = require("rxjs/observable/EmptyObservable");
  var ArrayLikeObservable = (function(_super) {
    __extends(ArrayLikeObservable, _super);
    function ArrayLikeObservable(arrayLike, mapFn, thisArg, scheduler) {
      _super.call(this);
      this.arrayLike = arrayLike;
      this.scheduler = scheduler;
      if (!mapFn && !scheduler && arrayLike.length === 1) {
        this._isScalar = true;
        this.value = arrayLike[0];
      }
      if (mapFn) {
        this.mapFn = mapFn.bind(thisArg);
      }
    }
    ArrayLikeObservable.create = function(arrayLike, mapFn, thisArg, scheduler) {
      var length = arrayLike.length;
      if (length === 0) {
        return new EmptyObservable_1.EmptyObservable();
      } else if (length === 1 && !mapFn) {
        return new ScalarObservable_1.ScalarObservable(arrayLike[0], scheduler);
      } else {
        return new ArrayLikeObservable(arrayLike, mapFn, thisArg, scheduler);
      }
    };
    ArrayLikeObservable.dispatch = function(state) {
      var arrayLike = state.arrayLike,
          index = state.index,
          length = state.length,
          mapFn = state.mapFn,
          subscriber = state.subscriber;
      if (subscriber.isUnsubscribed) {
        return ;
      }
      if (index >= length) {
        subscriber.complete();
        return ;
      }
      var result = mapFn ? mapFn(arrayLike[index], index) : arrayLike[index];
      subscriber.next(result);
      state.index = index + 1;
      this.schedule(state);
    };
    ArrayLikeObservable.prototype._subscribe = function(subscriber) {
      var index = 0;
      var _a = this,
          arrayLike = _a.arrayLike,
          mapFn = _a.mapFn,
          scheduler = _a.scheduler;
      var length = arrayLike.length;
      if (scheduler) {
        return scheduler.schedule(ArrayLikeObservable.dispatch, 0, {
          arrayLike: arrayLike,
          index: index,
          length: length,
          mapFn: mapFn,
          subscriber: subscriber
        });
      } else {
        for (var i = 0; i < length && !subscriber.isUnsubscribed; i++) {
          var result = mapFn ? mapFn(arrayLike[i], i) : arrayLike[i];
          subscriber.next(result);
        }
        subscriber.complete();
      }
    };
    return ArrayLikeObservable;
  }(Observable_1.Observable));
  exports.ArrayLikeObservable = ArrayLikeObservable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/Notification", ["rxjs/Observable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var Notification = (function() {
    function Notification(kind, value, exception) {
      this.kind = kind;
      this.value = value;
      this.exception = exception;
      this.hasValue = kind === 'N';
    }
    Notification.prototype.observe = function(observer) {
      switch (this.kind) {
        case 'N':
          return observer.next && observer.next(this.value);
        case 'E':
          return observer.error && observer.error(this.exception);
        case 'C':
          return observer.complete && observer.complete();
      }
    };
    Notification.prototype.do = function(next, error, complete) {
      var kind = this.kind;
      switch (kind) {
        case 'N':
          return next && next(this.value);
        case 'E':
          return error && error(this.exception);
        case 'C':
          return complete && complete();
      }
    };
    Notification.prototype.accept = function(nextOrObserver, error, complete) {
      if (nextOrObserver && typeof nextOrObserver.next === 'function') {
        return this.observe(nextOrObserver);
      } else {
        return this.do(nextOrObserver, error, complete);
      }
    };
    Notification.prototype.toObservable = function() {
      var kind = this.kind;
      switch (kind) {
        case 'N':
          return Observable_1.Observable.of(this.value);
        case 'E':
          return Observable_1.Observable.throw(this.exception);
        case 'C':
          return Observable_1.Observable.empty();
      }
    };
    Notification.createNext = function(value) {
      if (typeof value !== 'undefined') {
        return new Notification('N', value);
      }
      return this.undefinedValueNotification;
    };
    Notification.createError = function(err) {
      return new Notification('E', undefined, err);
    };
    Notification.createComplete = function() {
      return this.completeNotification;
    };
    Notification.completeNotification = new Notification('C');
    Notification.undefinedValueNotification = new Notification('N', undefined);
    return Notification;
  }());
  exports.Notification = Notification;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/FromEventObservable", ["rxjs/Observable", "rxjs/util/tryCatch", "rxjs/util/errorObject", "rxjs/Subscription"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var tryCatch_1 = require("rxjs/util/tryCatch");
  var errorObject_1 = require("rxjs/util/errorObject");
  var Subscription_1 = require("rxjs/Subscription");
  function isNodeStyleEventEmmitter(sourceObj) {
    return !!sourceObj && typeof sourceObj.addListener === 'function' && typeof sourceObj.removeListener === 'function';
  }
  function isJQueryStyleEventEmitter(sourceObj) {
    return !!sourceObj && typeof sourceObj.on === 'function' && typeof sourceObj.off === 'function';
  }
  function isNodeList(sourceObj) {
    return !!sourceObj && sourceObj.toString() === '[object NodeList]';
  }
  function isHTMLCollection(sourceObj) {
    return !!sourceObj && sourceObj.toString() === '[object HTMLCollection]';
  }
  function isEventTarget(sourceObj) {
    return !!sourceObj && typeof sourceObj.addEventListener === 'function' && typeof sourceObj.removeEventListener === 'function';
  }
  var FromEventObservable = (function(_super) {
    __extends(FromEventObservable, _super);
    function FromEventObservable(sourceObj, eventName, selector) {
      _super.call(this);
      this.sourceObj = sourceObj;
      this.eventName = eventName;
      this.selector = selector;
    }
    FromEventObservable.create = function(sourceObj, eventName, selector) {
      return new FromEventObservable(sourceObj, eventName, selector);
    };
    FromEventObservable.setupSubscription = function(sourceObj, eventName, handler, subscriber) {
      var unsubscribe;
      if (isNodeList(sourceObj) || isHTMLCollection(sourceObj)) {
        for (var i = 0,
            len = sourceObj.length; i < len; i++) {
          FromEventObservable.setupSubscription(sourceObj[i], eventName, handler, subscriber);
        }
      } else if (isEventTarget(sourceObj)) {
        sourceObj.addEventListener(eventName, handler);
        unsubscribe = function() {
          return sourceObj.removeEventListener(eventName, handler);
        };
      } else if (isJQueryStyleEventEmitter(sourceObj)) {
        sourceObj.on(eventName, handler);
        unsubscribe = function() {
          return sourceObj.off(eventName, handler);
        };
      } else if (isNodeStyleEventEmmitter(sourceObj)) {
        sourceObj.addListener(eventName, handler);
        unsubscribe = function() {
          return sourceObj.removeListener(eventName, handler);
        };
      }
      subscriber.add(new Subscription_1.Subscription(unsubscribe));
    };
    FromEventObservable.prototype._subscribe = function(subscriber) {
      var sourceObj = this.sourceObj;
      var eventName = this.eventName;
      var selector = this.selector;
      var handler = selector ? function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i - 0] = arguments[_i];
        }
        var result = tryCatch_1.tryCatch(selector).apply(void 0, args);
        if (result === errorObject_1.errorObject) {
          subscriber.error(errorObject_1.errorObject.e);
        } else {
          subscriber.next(result);
        }
      } : function(e) {
        return subscriber.next(e);
      };
      FromEventObservable.setupSubscription(sourceObj, eventName, handler, subscriber);
    };
    return FromEventObservable;
  }(Observable_1.Observable));
  exports.FromEventObservable = FromEventObservable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/FromEventPatternObservable", ["rxjs/Observable", "rxjs/Subscription", "rxjs/util/tryCatch", "rxjs/util/errorObject"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var Subscription_1 = require("rxjs/Subscription");
  var tryCatch_1 = require("rxjs/util/tryCatch");
  var errorObject_1 = require("rxjs/util/errorObject");
  var FromEventPatternObservable = (function(_super) {
    __extends(FromEventPatternObservable, _super);
    function FromEventPatternObservable(addHandler, removeHandler, selector) {
      _super.call(this);
      this.addHandler = addHandler;
      this.removeHandler = removeHandler;
      this.selector = selector;
    }
    FromEventPatternObservable.create = function(addHandler, removeHandler, selector) {
      return new FromEventPatternObservable(addHandler, removeHandler, selector);
    };
    FromEventPatternObservable.prototype._subscribe = function(subscriber) {
      var addHandler = this.addHandler;
      var removeHandler = this.removeHandler;
      var selector = this.selector;
      var handler = selector ? function(e) {
        var result = tryCatch_1.tryCatch(selector).apply(null, arguments);
        if (result === errorObject_1.errorObject) {
          subscriber.error(result.e);
        } else {
          subscriber.next(result);
        }
      } : function(e) {
        subscriber.next(e);
      };
      var result = tryCatch_1.tryCatch(addHandler)(handler);
      if (result === errorObject_1.errorObject) {
        subscriber.error(result.e);
      }
      subscriber.add(new Subscription_1.Subscription(function() {
        removeHandler(handler);
      }));
    };
    return FromEventPatternObservable;
  }(Observable_1.Observable));
  exports.FromEventPatternObservable = FromEventPatternObservable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/fromPromise", ["rxjs/observable/PromiseObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var PromiseObservable_1 = require("rxjs/observable/PromiseObservable");
  exports.fromPromise = PromiseObservable_1.PromiseObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/isNumeric", ["rxjs/util/isArray"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var isArray_1 = require("rxjs/util/isArray");
  function isNumeric(val) {
    return !isArray_1.isArray(val) && (val - parseFloat(val) + 1) >= 0;
  }
  exports.isNumeric = isNumeric;
  ;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/scheduler/FutureAction", ["rxjs/util/root", "rxjs/Subscription"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var root_1 = require("rxjs/util/root");
  var Subscription_1 = require("rxjs/Subscription");
  var FutureAction = (function(_super) {
    __extends(FutureAction, _super);
    function FutureAction(scheduler, work) {
      _super.call(this);
      this.scheduler = scheduler;
      this.work = work;
      this.pending = false;
    }
    FutureAction.prototype.execute = function() {
      if (this.isUnsubscribed) {
        this.error = new Error('executing a cancelled action');
      } else {
        try {
          this.work(this.state);
        } catch (e) {
          this.unsubscribe();
          this.error = e;
        }
      }
    };
    FutureAction.prototype.schedule = function(state, delay) {
      if (delay === void 0) {
        delay = 0;
      }
      if (this.isUnsubscribed) {
        return this;
      }
      return this._schedule(state, delay);
    };
    FutureAction.prototype._schedule = function(state, delay) {
      var _this = this;
      if (delay === void 0) {
        delay = 0;
      }
      this.state = state;
      this.pending = true;
      var id = this.id;
      if (id != null && this.delay === delay) {
        return this;
      }
      this.delay = delay;
      if (id != null) {
        this.id = null;
        root_1.root.clearInterval(id);
      }
      this.id = root_1.root.setInterval(function() {
        _this.pending = false;
        var _a = _this,
            id = _a.id,
            scheduler = _a.scheduler;
        scheduler.actions.push(_this);
        scheduler.flush();
        if (_this.pending === false && id != null) {
          _this.id = null;
          root_1.root.clearInterval(id);
        }
      }, delay);
      return this;
    };
    FutureAction.prototype._unsubscribe = function() {
      this.pending = false;
      var _a = this,
          id = _a.id,
          scheduler = _a.scheduler;
      var actions = scheduler.actions;
      var index = actions.indexOf(this);
      if (id != null) {
        this.id = null;
        root_1.root.clearInterval(id);
      }
      if (index !== -1) {
        actions.splice(index, 1);
      }
      this.work = null;
      this.state = null;
      this.scheduler = null;
    };
    return FutureAction;
  }(Subscription_1.Subscription));
  exports.FutureAction = FutureAction;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/scheduler/QueueAction", ["rxjs/scheduler/FutureAction"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var FutureAction_1 = require("rxjs/scheduler/FutureAction");
  var QueueAction = (function(_super) {
    __extends(QueueAction, _super);
    function QueueAction() {
      _super.apply(this, arguments);
    }
    QueueAction.prototype._schedule = function(state, delay) {
      if (delay === void 0) {
        delay = 0;
      }
      if (delay > 0) {
        return _super.prototype._schedule.call(this, state, delay);
      }
      this.delay = delay;
      this.state = state;
      var scheduler = this.scheduler;
      scheduler.actions.push(this);
      scheduler.flush();
      return this;
    };
    return QueueAction;
  }(FutureAction_1.FutureAction));
  exports.QueueAction = QueueAction;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/merge", ["rxjs/observable/ArrayObservable", "rxjs/operator/mergeAll", "rxjs/util/isScheduler"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var ArrayObservable_1 = require("rxjs/observable/ArrayObservable");
  var mergeAll_1 = require("rxjs/operator/mergeAll");
  var isScheduler_1 = require("rxjs/util/isScheduler");
  function merge() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      observables[_i - 0] = arguments[_i];
    }
    observables.unshift(this);
    return mergeStatic.apply(this, observables);
  }
  exports.merge = merge;
  function mergeStatic() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      observables[_i - 0] = arguments[_i];
    }
    var concurrent = Number.POSITIVE_INFINITY;
    var scheduler = null;
    var last = observables[observables.length - 1];
    if (isScheduler_1.isScheduler(last)) {
      scheduler = observables.pop();
      if (observables.length > 1 && typeof observables[observables.length - 1] === 'number') {
        concurrent = observables.pop();
      }
    } else if (typeof last === 'number') {
      concurrent = observables.pop();
    }
    if (observables.length === 1) {
      return observables[0];
    }
    return new ArrayObservable_1.ArrayObservable(observables, scheduler).lift(new mergeAll_1.MergeAllOperator(concurrent));
  }
  exports.mergeStatic = mergeStatic;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/race", ["rxjs/util/isArray", "rxjs/observable/ArrayObservable", "rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var isArray_1 = require("rxjs/util/isArray");
  var ArrayObservable_1 = require("rxjs/observable/ArrayObservable");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function race() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      observables[_i - 0] = arguments[_i];
    }
    if (observables.length === 1 && isArray_1.isArray(observables[0])) {
      observables = observables[0];
    }
    observables.unshift(this);
    return raceStatic.apply(this, observables);
  }
  exports.race = race;
  function raceStatic() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      observables[_i - 0] = arguments[_i];
    }
    if (observables.length === 1) {
      if (isArray_1.isArray(observables[0])) {
        observables = observables[0];
      } else {
        return observables[0];
      }
    }
    return new ArrayObservable_1.ArrayObservable(observables).lift(new RaceOperator());
  }
  exports.raceStatic = raceStatic;
  var RaceOperator = (function() {
    function RaceOperator() {}
    RaceOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new RaceSubscriber(subscriber));
    };
    return RaceOperator;
  }());
  exports.RaceOperator = RaceOperator;
  var RaceSubscriber = (function(_super) {
    __extends(RaceSubscriber, _super);
    function RaceSubscriber(destination) {
      _super.call(this, destination);
      this.hasFirst = false;
      this.observables = [];
      this.subscriptions = [];
    }
    RaceSubscriber.prototype._next = function(observable) {
      this.observables.push(observable);
    };
    RaceSubscriber.prototype._complete = function() {
      var observables = this.observables;
      var len = observables.length;
      if (len === 0) {
        this.destination.complete();
      } else {
        for (var i = 0; i < len; i++) {
          var observable = observables[i];
          var subscription = subscribeToResult_1.subscribeToResult(this, observable, observable, i);
          this.subscriptions.push(subscription);
          this.add(subscription);
        }
        this.observables = null;
      }
    };
    RaceSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      if (!this.hasFirst) {
        this.hasFirst = true;
        for (var i = 0; i < this.subscriptions.length; i++) {
          if (i !== outerIndex) {
            var subscription = this.subscriptions[i];
            subscription.unsubscribe();
            this.remove(subscription);
          }
        }
        this.subscriptions = null;
      }
      this.destination.next(innerValue);
    };
    return RaceSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  exports.RaceSubscriber = RaceSubscriber;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/noop", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  function noop() {}
  exports.noop = noop;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/of", ["rxjs/observable/ArrayObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var ArrayObservable_1 = require("rxjs/observable/ArrayObservable");
  exports.of = ArrayObservable_1.ArrayObservable.of;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/RangeObservable", ["rxjs/Observable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var RangeObservable = (function(_super) {
    __extends(RangeObservable, _super);
    function RangeObservable(start, count, scheduler) {
      _super.call(this);
      this.start = start;
      this._count = count;
      this.scheduler = scheduler;
    }
    RangeObservable.create = function(start, count, scheduler) {
      if (start === void 0) {
        start = 0;
      }
      if (count === void 0) {
        count = 0;
      }
      return new RangeObservable(start, count, scheduler);
    };
    RangeObservable.dispatch = function(state) {
      var start = state.start,
          index = state.index,
          count = state.count,
          subscriber = state.subscriber;
      if (index >= count) {
        subscriber.complete();
        return ;
      }
      subscriber.next(start);
      if (subscriber.isUnsubscribed) {
        return ;
      }
      state.index = index + 1;
      state.start = start + 1;
      this.schedule(state);
    };
    RangeObservable.prototype._subscribe = function(subscriber) {
      var index = 0;
      var start = this.start;
      var count = this._count;
      var scheduler = this.scheduler;
      if (scheduler) {
        return scheduler.schedule(RangeObservable.dispatch, 0, {
          index: index,
          count: count,
          start: start,
          subscriber: subscriber
        });
      } else {
        do {
          if (index++ >= count) {
            subscriber.complete();
            break;
          }
          subscriber.next(start++);
          if (subscriber.isUnsubscribed) {
            break;
          }
        } while (true);
      }
    };
    return RangeObservable;
  }(Observable_1.Observable));
  exports.RangeObservable = RangeObservable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/ErrorObservable", ["rxjs/Observable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var ErrorObservable = (function(_super) {
    __extends(ErrorObservable, _super);
    function ErrorObservable(error, scheduler) {
      _super.call(this);
      this.error = error;
      this.scheduler = scheduler;
    }
    ErrorObservable.create = function(error, scheduler) {
      return new ErrorObservable(error, scheduler);
    };
    ErrorObservable.dispatch = function(arg) {
      var error = arg.error,
          subscriber = arg.subscriber;
      subscriber.error(error);
    };
    ErrorObservable.prototype._subscribe = function(subscriber) {
      var error = this.error;
      var scheduler = this.scheduler;
      if (scheduler) {
        return scheduler.schedule(ErrorObservable.dispatch, 0, {
          error: error,
          subscriber: subscriber
        });
      } else {
        subscriber.error(error);
      }
    };
    return ErrorObservable;
  }(Observable_1.Observable));
  exports.ErrorObservable = ErrorObservable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/isDate", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  function isDate(value) {
    return value instanceof Date && !isNaN(+value);
  }
  exports.isDate = isDate;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/zip", ["rxjs/observable/ArrayObservable", "rxjs/util/isArray", "rxjs/Subscriber", "rxjs/OuterSubscriber", "rxjs/util/subscribeToResult", "rxjs/symbol/iterator"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var ArrayObservable_1 = require("rxjs/observable/ArrayObservable");
  var isArray_1 = require("rxjs/util/isArray");
  var Subscriber_1 = require("rxjs/Subscriber");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  var iterator_1 = require("rxjs/symbol/iterator");
  function zipProto() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      observables[_i - 0] = arguments[_i];
    }
    observables.unshift(this);
    return zipStatic.apply(this, observables);
  }
  exports.zipProto = zipProto;
  function zipStatic() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      observables[_i - 0] = arguments[_i];
    }
    var project = observables[observables.length - 1];
    if (typeof project === 'function') {
      observables.pop();
    }
    return new ArrayObservable_1.ArrayObservable(observables).lift(new ZipOperator(project));
  }
  exports.zipStatic = zipStatic;
  var ZipOperator = (function() {
    function ZipOperator(project) {
      this.project = project;
    }
    ZipOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new ZipSubscriber(subscriber, this.project));
    };
    return ZipOperator;
  }());
  exports.ZipOperator = ZipOperator;
  var ZipSubscriber = (function(_super) {
    __extends(ZipSubscriber, _super);
    function ZipSubscriber(destination, project, values) {
      if (values === void 0) {
        values = Object.create(null);
      }
      _super.call(this, destination);
      this.index = 0;
      this.iterators = [];
      this.active = 0;
      this.project = (typeof project === 'function') ? project : null;
      this.values = values;
    }
    ZipSubscriber.prototype._next = function(value) {
      var iterators = this.iterators;
      var index = this.index++;
      if (isArray_1.isArray(value)) {
        iterators.push(new StaticArrayIterator(value));
      } else if (typeof value[iterator_1.$$iterator] === 'function') {
        iterators.push(new StaticIterator(value[iterator_1.$$iterator]()));
      } else {
        iterators.push(new ZipBufferIterator(this.destination, this, value, index));
      }
    };
    ZipSubscriber.prototype._complete = function() {
      var iterators = this.iterators;
      var len = iterators.length;
      this.active = len;
      for (var i = 0; i < len; i++) {
        var iterator = iterators[i];
        if (iterator.stillUnsubscribed) {
          this.add(iterator.subscribe(iterator, i));
        } else {
          this.active--;
        }
      }
    };
    ZipSubscriber.prototype.notifyInactive = function() {
      this.active--;
      if (this.active === 0) {
        this.destination.complete();
      }
    };
    ZipSubscriber.prototype.checkIterators = function() {
      var iterators = this.iterators;
      var len = iterators.length;
      var destination = this.destination;
      for (var i = 0; i < len; i++) {
        var iterator = iterators[i];
        if (typeof iterator.hasValue === 'function' && !iterator.hasValue()) {
          return ;
        }
      }
      var shouldComplete = false;
      var args = [];
      for (var i = 0; i < len; i++) {
        var iterator = iterators[i];
        var result = iterator.next();
        if (iterator.hasCompleted()) {
          shouldComplete = true;
        }
        if (result.done) {
          destination.complete();
          return ;
        }
        args.push(result.value);
      }
      if (this.project) {
        this._tryProject(args);
      } else {
        destination.next(args);
      }
      if (shouldComplete) {
        destination.complete();
      }
    };
    ZipSubscriber.prototype._tryProject = function(args) {
      var result;
      try {
        result = this.project.apply(this, args);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      this.destination.next(result);
    };
    return ZipSubscriber;
  }(Subscriber_1.Subscriber));
  exports.ZipSubscriber = ZipSubscriber;
  var StaticIterator = (function() {
    function StaticIterator(iterator) {
      this.iterator = iterator;
      this.nextResult = iterator.next();
    }
    StaticIterator.prototype.hasValue = function() {
      return true;
    };
    StaticIterator.prototype.next = function() {
      var result = this.nextResult;
      this.nextResult = this.iterator.next();
      return result;
    };
    StaticIterator.prototype.hasCompleted = function() {
      var nextResult = this.nextResult;
      return nextResult && nextResult.done;
    };
    return StaticIterator;
  }());
  var StaticArrayIterator = (function() {
    function StaticArrayIterator(array) {
      this.array = array;
      this.index = 0;
      this.length = 0;
      this.length = array.length;
    }
    StaticArrayIterator.prototype[iterator_1.$$iterator] = function() {
      return this;
    };
    StaticArrayIterator.prototype.next = function(value) {
      var i = this.index++;
      var array = this.array;
      return i < this.length ? {
        value: array[i],
        done: false
      } : {done: true};
    };
    StaticArrayIterator.prototype.hasValue = function() {
      return this.array.length > this.index;
    };
    StaticArrayIterator.prototype.hasCompleted = function() {
      return this.array.length === this.index;
    };
    return StaticArrayIterator;
  }());
  var ZipBufferIterator = (function(_super) {
    __extends(ZipBufferIterator, _super);
    function ZipBufferIterator(destination, parent, observable, index) {
      _super.call(this, destination);
      this.parent = parent;
      this.observable = observable;
      this.index = index;
      this.stillUnsubscribed = true;
      this.buffer = [];
      this.isComplete = false;
    }
    ZipBufferIterator.prototype[iterator_1.$$iterator] = function() {
      return this;
    };
    ZipBufferIterator.prototype.next = function() {
      var buffer = this.buffer;
      if (buffer.length === 0 && this.isComplete) {
        return {done: true};
      } else {
        return {
          value: buffer.shift(),
          done: false
        };
      }
    };
    ZipBufferIterator.prototype.hasValue = function() {
      return this.buffer.length > 0;
    };
    ZipBufferIterator.prototype.hasCompleted = function() {
      return this.buffer.length === 0 && this.isComplete;
    };
    ZipBufferIterator.prototype.notifyComplete = function() {
      if (this.buffer.length > 0) {
        this.isComplete = true;
        this.parent.notifyInactive();
      } else {
        this.destination.complete();
      }
    };
    ZipBufferIterator.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.buffer.push(innerValue);
      this.parent.checkIterators();
    };
    ZipBufferIterator.prototype.subscribe = function(value, index) {
      return subscribeToResult_1.subscribeToResult(this, this.observable, this, index);
    };
    return ZipBufferIterator;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/buffer", ["rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function buffer(closingNotifier) {
    return this.lift(new BufferOperator(closingNotifier));
  }
  exports.buffer = buffer;
  var BufferOperator = (function() {
    function BufferOperator(closingNotifier) {
      this.closingNotifier = closingNotifier;
    }
    BufferOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new BufferSubscriber(subscriber, this.closingNotifier));
    };
    return BufferOperator;
  }());
  var BufferSubscriber = (function(_super) {
    __extends(BufferSubscriber, _super);
    function BufferSubscriber(destination, closingNotifier) {
      _super.call(this, destination);
      this.buffer = [];
      this.add(subscribeToResult_1.subscribeToResult(this, closingNotifier));
    }
    BufferSubscriber.prototype._next = function(value) {
      this.buffer.push(value);
    };
    BufferSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      var buffer = this.buffer;
      this.buffer = [];
      this.destination.next(buffer);
    };
    return BufferSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/bufferCount", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function bufferCount(bufferSize, startBufferEvery) {
    if (startBufferEvery === void 0) {
      startBufferEvery = null;
    }
    return this.lift(new BufferCountOperator(bufferSize, startBufferEvery));
  }
  exports.bufferCount = bufferCount;
  var BufferCountOperator = (function() {
    function BufferCountOperator(bufferSize, startBufferEvery) {
      this.bufferSize = bufferSize;
      this.startBufferEvery = startBufferEvery;
    }
    BufferCountOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new BufferCountSubscriber(subscriber, this.bufferSize, this.startBufferEvery));
    };
    return BufferCountOperator;
  }());
  var BufferCountSubscriber = (function(_super) {
    __extends(BufferCountSubscriber, _super);
    function BufferCountSubscriber(destination, bufferSize, startBufferEvery) {
      _super.call(this, destination);
      this.bufferSize = bufferSize;
      this.startBufferEvery = startBufferEvery;
      this.buffers = [[]];
      this.count = 0;
    }
    BufferCountSubscriber.prototype._next = function(value) {
      var count = (this.count += 1);
      var destination = this.destination;
      var bufferSize = this.bufferSize;
      var startBufferEvery = (this.startBufferEvery == null) ? bufferSize : this.startBufferEvery;
      var buffers = this.buffers;
      var len = buffers.length;
      var remove = -1;
      if (count % startBufferEvery === 0) {
        buffers.push([]);
      }
      for (var i = 0; i < len; i++) {
        var buffer = buffers[i];
        buffer.push(value);
        if (buffer.length === bufferSize) {
          remove = i;
          destination.next(buffer);
        }
      }
      if (remove !== -1) {
        buffers.splice(remove, 1);
      }
    };
    BufferCountSubscriber.prototype._complete = function() {
      var destination = this.destination;
      var buffers = this.buffers;
      while (buffers.length > 0) {
        var buffer = buffers.shift();
        if (buffer.length > 0) {
          destination.next(buffer);
        }
      }
      _super.prototype._complete.call(this);
    };
    return BufferCountSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/bufferTime", ["rxjs/Subscriber", "rxjs/scheduler/async"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var async_1 = require("rxjs/scheduler/async");
  function bufferTime(bufferTimeSpan, bufferCreationInterval, scheduler) {
    if (bufferCreationInterval === void 0) {
      bufferCreationInterval = null;
    }
    if (scheduler === void 0) {
      scheduler = async_1.async;
    }
    return this.lift(new BufferTimeOperator(bufferTimeSpan, bufferCreationInterval, scheduler));
  }
  exports.bufferTime = bufferTime;
  var BufferTimeOperator = (function() {
    function BufferTimeOperator(bufferTimeSpan, bufferCreationInterval, scheduler) {
      this.bufferTimeSpan = bufferTimeSpan;
      this.bufferCreationInterval = bufferCreationInterval;
      this.scheduler = scheduler;
    }
    BufferTimeOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new BufferTimeSubscriber(subscriber, this.bufferTimeSpan, this.bufferCreationInterval, this.scheduler));
    };
    return BufferTimeOperator;
  }());
  var BufferTimeSubscriber = (function(_super) {
    __extends(BufferTimeSubscriber, _super);
    function BufferTimeSubscriber(destination, bufferTimeSpan, bufferCreationInterval, scheduler) {
      _super.call(this, destination);
      this.bufferTimeSpan = bufferTimeSpan;
      this.bufferCreationInterval = bufferCreationInterval;
      this.scheduler = scheduler;
      this.buffers = [];
      var buffer = this.openBuffer();
      if (bufferCreationInterval !== null && bufferCreationInterval >= 0) {
        var closeState = {
          subscriber: this,
          buffer: buffer
        };
        var creationState = {
          bufferTimeSpan: bufferTimeSpan,
          bufferCreationInterval: bufferCreationInterval,
          subscriber: this,
          scheduler: scheduler
        };
        this.add(scheduler.schedule(dispatchBufferClose, bufferTimeSpan, closeState));
        this.add(scheduler.schedule(dispatchBufferCreation, bufferCreationInterval, creationState));
      } else {
        var timeSpanOnlyState = {
          subscriber: this,
          buffer: buffer,
          bufferTimeSpan: bufferTimeSpan
        };
        this.add(scheduler.schedule(dispatchBufferTimeSpanOnly, bufferTimeSpan, timeSpanOnlyState));
      }
    }
    BufferTimeSubscriber.prototype._next = function(value) {
      var buffers = this.buffers;
      var len = buffers.length;
      for (var i = 0; i < len; i++) {
        buffers[i].push(value);
      }
    };
    BufferTimeSubscriber.prototype._error = function(err) {
      this.buffers.length = 0;
      _super.prototype._error.call(this, err);
    };
    BufferTimeSubscriber.prototype._complete = function() {
      var _a = this,
          buffers = _a.buffers,
          destination = _a.destination;
      while (buffers.length > 0) {
        destination.next(buffers.shift());
      }
      _super.prototype._complete.call(this);
    };
    BufferTimeSubscriber.prototype._unsubscribe = function() {
      this.buffers = null;
    };
    BufferTimeSubscriber.prototype.openBuffer = function() {
      var buffer = [];
      this.buffers.push(buffer);
      return buffer;
    };
    BufferTimeSubscriber.prototype.closeBuffer = function(buffer) {
      this.destination.next(buffer);
      var buffers = this.buffers;
      buffers.splice(buffers.indexOf(buffer), 1);
    };
    return BufferTimeSubscriber;
  }(Subscriber_1.Subscriber));
  function dispatchBufferTimeSpanOnly(state) {
    var subscriber = state.subscriber;
    var prevBuffer = state.buffer;
    if (prevBuffer) {
      subscriber.closeBuffer(prevBuffer);
    }
    state.buffer = subscriber.openBuffer();
    if (!subscriber.isUnsubscribed) {
      this.schedule(state, state.bufferTimeSpan);
    }
  }
  function dispatchBufferCreation(state) {
    var bufferCreationInterval = state.bufferCreationInterval,
        bufferTimeSpan = state.bufferTimeSpan,
        subscriber = state.subscriber,
        scheduler = state.scheduler;
    var buffer = subscriber.openBuffer();
    var action = this;
    if (!subscriber.isUnsubscribed) {
      action.add(scheduler.schedule(dispatchBufferClose, bufferTimeSpan, {
        subscriber: subscriber,
        buffer: buffer
      }));
      action.schedule(state, bufferCreationInterval);
    }
  }
  function dispatchBufferClose(arg) {
    var subscriber = arg.subscriber,
        buffer = arg.buffer;
    subscriber.closeBuffer(buffer);
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/bufferToggle", ["rxjs/Subscription", "rxjs/util/subscribeToResult", "rxjs/OuterSubscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscription_1 = require("rxjs/Subscription");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  function bufferToggle(openings, closingSelector) {
    return this.lift(new BufferToggleOperator(openings, closingSelector));
  }
  exports.bufferToggle = bufferToggle;
  var BufferToggleOperator = (function() {
    function BufferToggleOperator(openings, closingSelector) {
      this.openings = openings;
      this.closingSelector = closingSelector;
    }
    BufferToggleOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new BufferToggleSubscriber(subscriber, this.openings, this.closingSelector));
    };
    return BufferToggleOperator;
  }());
  var BufferToggleSubscriber = (function(_super) {
    __extends(BufferToggleSubscriber, _super);
    function BufferToggleSubscriber(destination, openings, closingSelector) {
      _super.call(this, destination);
      this.openings = openings;
      this.closingSelector = closingSelector;
      this.contexts = [];
      this.add(subscribeToResult_1.subscribeToResult(this, openings));
    }
    BufferToggleSubscriber.prototype._next = function(value) {
      var contexts = this.contexts;
      var len = contexts.length;
      for (var i = 0; i < len; i++) {
        contexts[i].buffer.push(value);
      }
    };
    BufferToggleSubscriber.prototype._error = function(err) {
      var contexts = this.contexts;
      while (contexts.length > 0) {
        var context = contexts.shift();
        context.subscription.unsubscribe();
        context.buffer = null;
        context.subscription = null;
      }
      this.contexts = null;
      _super.prototype._error.call(this, err);
    };
    BufferToggleSubscriber.prototype._complete = function() {
      var contexts = this.contexts;
      while (contexts.length > 0) {
        var context = contexts.shift();
        this.destination.next(context.buffer);
        context.subscription.unsubscribe();
        context.buffer = null;
        context.subscription = null;
      }
      this.contexts = null;
      _super.prototype._complete.call(this);
    };
    BufferToggleSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      outerValue ? this.closeBuffer(outerValue) : this.openBuffer(innerValue);
    };
    BufferToggleSubscriber.prototype.notifyComplete = function(innerSub) {
      this.closeBuffer(innerSub.context);
    };
    BufferToggleSubscriber.prototype.openBuffer = function(value) {
      try {
        var closingSelector = this.closingSelector;
        var closingNotifier = closingSelector.call(this, value);
        if (closingNotifier) {
          this.trySubscribe(closingNotifier);
        }
      } catch (err) {
        this._error(err);
      }
    };
    BufferToggleSubscriber.prototype.closeBuffer = function(context) {
      var contexts = this.contexts;
      if (contexts && context) {
        var buffer = context.buffer,
            subscription = context.subscription;
        this.destination.next(buffer);
        contexts.splice(contexts.indexOf(context), 1);
        this.remove(subscription);
        subscription.unsubscribe();
      }
    };
    BufferToggleSubscriber.prototype.trySubscribe = function(closingNotifier) {
      var contexts = this.contexts;
      var buffer = [];
      var subscription = new Subscription_1.Subscription();
      var context = {
        buffer: buffer,
        subscription: subscription
      };
      contexts.push(context);
      var innerSubscription = subscribeToResult_1.subscribeToResult(this, closingNotifier, context);
      if (!innerSubscription || innerSubscription.isUnsubscribed) {
        this.closeBuffer(context);
      } else {
        innerSubscription.context = context;
        this.add(innerSubscription);
        subscription.add(innerSubscription);
      }
    };
    return BufferToggleSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/bufferWhen", ["rxjs/Subscription", "rxjs/util/tryCatch", "rxjs/util/errorObject", "rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscription_1 = require("rxjs/Subscription");
  var tryCatch_1 = require("rxjs/util/tryCatch");
  var errorObject_1 = require("rxjs/util/errorObject");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function bufferWhen(closingSelector) {
    return this.lift(new BufferWhenOperator(closingSelector));
  }
  exports.bufferWhen = bufferWhen;
  var BufferWhenOperator = (function() {
    function BufferWhenOperator(closingSelector) {
      this.closingSelector = closingSelector;
    }
    BufferWhenOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new BufferWhenSubscriber(subscriber, this.closingSelector));
    };
    return BufferWhenOperator;
  }());
  var BufferWhenSubscriber = (function(_super) {
    __extends(BufferWhenSubscriber, _super);
    function BufferWhenSubscriber(destination, closingSelector) {
      _super.call(this, destination);
      this.closingSelector = closingSelector;
      this.subscribing = false;
      this.openBuffer();
    }
    BufferWhenSubscriber.prototype._next = function(value) {
      this.buffer.push(value);
    };
    BufferWhenSubscriber.prototype._complete = function() {
      var buffer = this.buffer;
      if (buffer) {
        this.destination.next(buffer);
      }
      _super.prototype._complete.call(this);
    };
    BufferWhenSubscriber.prototype._unsubscribe = function() {
      this.buffer = null;
      this.subscribing = false;
    };
    BufferWhenSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.openBuffer();
    };
    BufferWhenSubscriber.prototype.notifyComplete = function() {
      if (this.subscribing) {
        this.complete();
      } else {
        this.openBuffer();
      }
    };
    BufferWhenSubscriber.prototype.openBuffer = function() {
      var closingSubscription = this.closingSubscription;
      if (closingSubscription) {
        this.remove(closingSubscription);
        closingSubscription.unsubscribe();
      }
      var buffer = this.buffer;
      if (this.buffer) {
        this.destination.next(buffer);
      }
      this.buffer = [];
      var closingNotifier = tryCatch_1.tryCatch(this.closingSelector)();
      if (closingNotifier === errorObject_1.errorObject) {
        this.error(errorObject_1.errorObject.e);
      } else {
        closingSubscription = new Subscription_1.Subscription();
        this.closingSubscription = closingSubscription;
        this.add(closingSubscription);
        this.subscribing = true;
        closingSubscription.add(subscribeToResult_1.subscribeToResult(this, closingNotifier));
        this.subscribing = false;
      }
    };
    return BufferWhenSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/scheduler/queue", ["rxjs/scheduler/QueueScheduler"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var QueueScheduler_1 = require("rxjs/scheduler/QueueScheduler");
  exports.queue = new QueueScheduler_1.QueueScheduler();
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/ConnectableObservable", ["rxjs/Observable", "rxjs/Subscriber", "rxjs/Subscription"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var Subscriber_1 = require("rxjs/Subscriber");
  var Subscription_1 = require("rxjs/Subscription");
  var ConnectableObservable = (function(_super) {
    __extends(ConnectableObservable, _super);
    function ConnectableObservable(source, subjectFactory) {
      _super.call(this);
      this.source = source;
      this.subjectFactory = subjectFactory;
    }
    ConnectableObservable.prototype._subscribe = function(subscriber) {
      return this.getSubject().subscribe(subscriber);
    };
    ConnectableObservable.prototype.getSubject = function() {
      var subject = this.subject;
      if (subject && !subject.isUnsubscribed) {
        return subject;
      }
      return (this.subject = this.subjectFactory());
    };
    ConnectableObservable.prototype.connect = function() {
      var source = this.source;
      var subscription = this.subscription;
      if (subscription && !subscription.isUnsubscribed) {
        return subscription;
      }
      subscription = source.subscribe(this.getSubject());
      subscription.add(new ConnectableSubscription(this));
      return (this.subscription = subscription);
    };
    ConnectableObservable.prototype.refCount = function() {
      return new RefCountObservable(this);
    };
    ConnectableObservable.prototype._closeSubscription = function() {
      this.subject = null;
      this.subscription = null;
    };
    return ConnectableObservable;
  }(Observable_1.Observable));
  exports.ConnectableObservable = ConnectableObservable;
  var ConnectableSubscription = (function(_super) {
    __extends(ConnectableSubscription, _super);
    function ConnectableSubscription(connectable) {
      _super.call(this);
      this.connectable = connectable;
    }
    ConnectableSubscription.prototype._unsubscribe = function() {
      var connectable = this.connectable;
      connectable._closeSubscription();
      this.connectable = null;
    };
    return ConnectableSubscription;
  }(Subscription_1.Subscription));
  var RefCountObservable = (function(_super) {
    __extends(RefCountObservable, _super);
    function RefCountObservable(connectable, refCount) {
      if (refCount === void 0) {
        refCount = 0;
      }
      _super.call(this);
      this.connectable = connectable;
      this.refCount = refCount;
    }
    RefCountObservable.prototype._subscribe = function(subscriber) {
      var connectable = this.connectable;
      var refCountSubscriber = new RefCountSubscriber(subscriber, this);
      var subscription = connectable.subscribe(refCountSubscriber);
      if (!subscription.isUnsubscribed && ++this.refCount === 1) {
        refCountSubscriber.connection = this.connection = connectable.connect();
      }
      return subscription;
    };
    return RefCountObservable;
  }(Observable_1.Observable));
  var RefCountSubscriber = (function(_super) {
    __extends(RefCountSubscriber, _super);
    function RefCountSubscriber(destination, refCountObservable) {
      _super.call(this, null);
      this.destination = destination;
      this.refCountObservable = refCountObservable;
      this.connection = refCountObservable.connection;
      destination.add(this);
    }
    RefCountSubscriber.prototype._next = function(value) {
      this.destination.next(value);
    };
    RefCountSubscriber.prototype._error = function(err) {
      this._resetConnectable();
      this.destination.error(err);
    };
    RefCountSubscriber.prototype._complete = function() {
      this._resetConnectable();
      this.destination.complete();
    };
    RefCountSubscriber.prototype._resetConnectable = function() {
      var observable = this.refCountObservable;
      var obsConnection = observable.connection;
      var subConnection = this.connection;
      if (subConnection && subConnection === obsConnection) {
        observable.refCount = 0;
        obsConnection.unsubscribe();
        observable.connection = null;
        this.unsubscribe();
      }
    };
    RefCountSubscriber.prototype._unsubscribe = function() {
      var observable = this.refCountObservable;
      if (observable.refCount === 0) {
        return ;
      }
      if (--observable.refCount === 0) {
        var obsConnection = observable.connection;
        var subConnection = this.connection;
        if (subConnection && subConnection === obsConnection) {
          obsConnection.unsubscribe();
          observable.connection = null;
        }
      }
    };
    return RefCountSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/catch", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function _catch(selector) {
    var operator = new CatchOperator(selector);
    var caught = this.lift(operator);
    return (operator.caught = caught);
  }
  exports._catch = _catch;
  var CatchOperator = (function() {
    function CatchOperator(selector) {
      this.selector = selector;
    }
    CatchOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new CatchSubscriber(subscriber, this.selector, this.caught));
    };
    return CatchOperator;
  }());
  var CatchSubscriber = (function(_super) {
    __extends(CatchSubscriber, _super);
    function CatchSubscriber(destination, selector, caught) {
      _super.call(this, destination);
      this.selector = selector;
      this.caught = caught;
    }
    CatchSubscriber.prototype.error = function(err) {
      if (!this.isStopped) {
        var result = void 0;
        try {
          result = this.selector(err, this.caught);
        } catch (err) {
          this.destination.error(err);
          return ;
        }
        this._innerSub(result);
      }
    };
    CatchSubscriber.prototype._innerSub = function(result) {
      this.unsubscribe();
      this.destination.remove(this);
      result.subscribe(this.destination);
    };
    return CatchSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/combineAll", ["rxjs/operator/combineLatest"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var combineLatest_1 = require("rxjs/operator/combineLatest");
  function combineAll(project) {
    return this.lift(new combineLatest_1.CombineLatestOperator(project));
  }
  exports.combineAll = combineAll;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/combineLatest", ["rxjs/Observable", "rxjs/operator/combineLatest"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var combineLatest_1 = require("rxjs/operator/combineLatest");
  Observable_1.Observable.prototype.combineLatest = combineLatest_1.combineLatest;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/concat", ["rxjs/Observable", "rxjs/operator/concat"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var concat_1 = require("rxjs/operator/concat");
  Observable_1.Observable.prototype.concat = concat_1.concat;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/concatAll", ["rxjs/operator/mergeAll"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var mergeAll_1 = require("rxjs/operator/mergeAll");
  function concatAll() {
    return this.lift(new mergeAll_1.MergeAllOperator(1));
  }
  exports.concatAll = concatAll;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/mergeMap", ["rxjs/util/subscribeToResult", "rxjs/OuterSubscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  function mergeMap(project, resultSelector, concurrent) {
    if (concurrent === void 0) {
      concurrent = Number.POSITIVE_INFINITY;
    }
    if (typeof resultSelector === 'number') {
      concurrent = resultSelector;
      resultSelector = null;
    }
    return this.lift(new MergeMapOperator(project, resultSelector, concurrent));
  }
  exports.mergeMap = mergeMap;
  var MergeMapOperator = (function() {
    function MergeMapOperator(project, resultSelector, concurrent) {
      if (concurrent === void 0) {
        concurrent = Number.POSITIVE_INFINITY;
      }
      this.project = project;
      this.resultSelector = resultSelector;
      this.concurrent = concurrent;
    }
    MergeMapOperator.prototype.call = function(observer, source) {
      return source._subscribe(new MergeMapSubscriber(observer, this.project, this.resultSelector, this.concurrent));
    };
    return MergeMapOperator;
  }());
  exports.MergeMapOperator = MergeMapOperator;
  var MergeMapSubscriber = (function(_super) {
    __extends(MergeMapSubscriber, _super);
    function MergeMapSubscriber(destination, project, resultSelector, concurrent) {
      if (concurrent === void 0) {
        concurrent = Number.POSITIVE_INFINITY;
      }
      _super.call(this, destination);
      this.project = project;
      this.resultSelector = resultSelector;
      this.concurrent = concurrent;
      this.hasCompleted = false;
      this.buffer = [];
      this.active = 0;
      this.index = 0;
    }
    MergeMapSubscriber.prototype._next = function(value) {
      if (this.active < this.concurrent) {
        this._tryNext(value);
      } else {
        this.buffer.push(value);
      }
    };
    MergeMapSubscriber.prototype._tryNext = function(value) {
      var result;
      var index = this.index++;
      try {
        result = this.project(value, index);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      this.active++;
      this._innerSub(result, value, index);
    };
    MergeMapSubscriber.prototype._innerSub = function(ish, value, index) {
      this.add(subscribeToResult_1.subscribeToResult(this, ish, value, index));
    };
    MergeMapSubscriber.prototype._complete = function() {
      this.hasCompleted = true;
      if (this.active === 0 && this.buffer.length === 0) {
        this.destination.complete();
      }
    };
    MergeMapSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      if (this.resultSelector) {
        this._notifyResultSelector(outerValue, innerValue, outerIndex, innerIndex);
      } else {
        this.destination.next(innerValue);
      }
    };
    MergeMapSubscriber.prototype._notifyResultSelector = function(outerValue, innerValue, outerIndex, innerIndex) {
      var result;
      try {
        result = this.resultSelector(outerValue, innerValue, outerIndex, innerIndex);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      this.destination.next(result);
    };
    MergeMapSubscriber.prototype.notifyComplete = function(innerSub) {
      var buffer = this.buffer;
      this.remove(innerSub);
      this.active--;
      if (buffer.length > 0) {
        this._next(buffer.shift());
      } else if (this.active === 0 && this.hasCompleted) {
        this.destination.complete();
      }
    };
    return MergeMapSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  exports.MergeMapSubscriber = MergeMapSubscriber;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/mergeMapTo", ["rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function mergeMapTo(innerObservable, resultSelector, concurrent) {
    if (concurrent === void 0) {
      concurrent = Number.POSITIVE_INFINITY;
    }
    if (typeof resultSelector === 'number') {
      concurrent = resultSelector;
      resultSelector = null;
    }
    return this.lift(new MergeMapToOperator(innerObservable, resultSelector, concurrent));
  }
  exports.mergeMapTo = mergeMapTo;
  var MergeMapToOperator = (function() {
    function MergeMapToOperator(ish, resultSelector, concurrent) {
      if (concurrent === void 0) {
        concurrent = Number.POSITIVE_INFINITY;
      }
      this.ish = ish;
      this.resultSelector = resultSelector;
      this.concurrent = concurrent;
    }
    MergeMapToOperator.prototype.call = function(observer, source) {
      return source._subscribe(new MergeMapToSubscriber(observer, this.ish, this.resultSelector, this.concurrent));
    };
    return MergeMapToOperator;
  }());
  exports.MergeMapToOperator = MergeMapToOperator;
  var MergeMapToSubscriber = (function(_super) {
    __extends(MergeMapToSubscriber, _super);
    function MergeMapToSubscriber(destination, ish, resultSelector, concurrent) {
      if (concurrent === void 0) {
        concurrent = Number.POSITIVE_INFINITY;
      }
      _super.call(this, destination);
      this.ish = ish;
      this.resultSelector = resultSelector;
      this.concurrent = concurrent;
      this.hasCompleted = false;
      this.buffer = [];
      this.active = 0;
      this.index = 0;
    }
    MergeMapToSubscriber.prototype._next = function(value) {
      if (this.active < this.concurrent) {
        var resultSelector = this.resultSelector;
        var index = this.index++;
        var ish = this.ish;
        var destination = this.destination;
        this.active++;
        this._innerSub(ish, destination, resultSelector, value, index);
      } else {
        this.buffer.push(value);
      }
    };
    MergeMapToSubscriber.prototype._innerSub = function(ish, destination, resultSelector, value, index) {
      this.add(subscribeToResult_1.subscribeToResult(this, ish, value, index));
    };
    MergeMapToSubscriber.prototype._complete = function() {
      this.hasCompleted = true;
      if (this.active === 0 && this.buffer.length === 0) {
        this.destination.complete();
      }
    };
    MergeMapToSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      var _a = this,
          resultSelector = _a.resultSelector,
          destination = _a.destination;
      if (resultSelector) {
        this.trySelectResult(outerValue, innerValue, outerIndex, innerIndex);
      } else {
        destination.next(innerValue);
      }
    };
    MergeMapToSubscriber.prototype.trySelectResult = function(outerValue, innerValue, outerIndex, innerIndex) {
      var _a = this,
          resultSelector = _a.resultSelector,
          destination = _a.destination;
      var result;
      try {
        result = resultSelector(outerValue, innerValue, outerIndex, innerIndex);
      } catch (err) {
        destination.error(err);
        return ;
      }
      destination.next(result);
    };
    MergeMapToSubscriber.prototype.notifyError = function(err) {
      this.destination.error(err);
    };
    MergeMapToSubscriber.prototype.notifyComplete = function(innerSub) {
      var buffer = this.buffer;
      this.remove(innerSub);
      this.active--;
      if (buffer.length > 0) {
        this._next(buffer.shift());
      } else if (this.active === 0 && this.hasCompleted) {
        this.destination.complete();
      }
    };
    return MergeMapToSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  exports.MergeMapToSubscriber = MergeMapToSubscriber;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/count", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function count(predicate) {
    return this.lift(new CountOperator(predicate, this));
  }
  exports.count = count;
  var CountOperator = (function() {
    function CountOperator(predicate, source) {
      this.predicate = predicate;
      this.source = source;
    }
    CountOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new CountSubscriber(subscriber, this.predicate, this.source));
    };
    return CountOperator;
  }());
  var CountSubscriber = (function(_super) {
    __extends(CountSubscriber, _super);
    function CountSubscriber(destination, predicate, source) {
      _super.call(this, destination);
      this.predicate = predicate;
      this.source = source;
      this.count = 0;
      this.index = 0;
    }
    CountSubscriber.prototype._next = function(value) {
      if (this.predicate) {
        this._tryPredicate(value);
      } else {
        this.count++;
      }
    };
    CountSubscriber.prototype._tryPredicate = function(value) {
      var result;
      try {
        result = this.predicate(value, this.index++, this.source);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      if (result) {
        this.count++;
      }
    };
    CountSubscriber.prototype._complete = function() {
      this.destination.next(this.count);
      this.destination.complete();
    };
    return CountSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/dematerialize", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function dematerialize() {
    return this.lift(new DeMaterializeOperator());
  }
  exports.dematerialize = dematerialize;
  var DeMaterializeOperator = (function() {
    function DeMaterializeOperator() {}
    DeMaterializeOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new DeMaterializeSubscriber(subscriber));
    };
    return DeMaterializeOperator;
  }());
  var DeMaterializeSubscriber = (function(_super) {
    __extends(DeMaterializeSubscriber, _super);
    function DeMaterializeSubscriber(destination) {
      _super.call(this, destination);
    }
    DeMaterializeSubscriber.prototype._next = function(value) {
      value.observe(this.destination);
    };
    return DeMaterializeSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/debounce", ["rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function debounce(durationSelector) {
    return this.lift(new DebounceOperator(durationSelector));
  }
  exports.debounce = debounce;
  var DebounceOperator = (function() {
    function DebounceOperator(durationSelector) {
      this.durationSelector = durationSelector;
    }
    DebounceOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new DebounceSubscriber(subscriber, this.durationSelector));
    };
    return DebounceOperator;
  }());
  var DebounceSubscriber = (function(_super) {
    __extends(DebounceSubscriber, _super);
    function DebounceSubscriber(destination, durationSelector) {
      _super.call(this, destination);
      this.durationSelector = durationSelector;
      this.hasValue = false;
      this.durationSubscription = null;
    }
    DebounceSubscriber.prototype._next = function(value) {
      try {
        var result = this.durationSelector.call(this, value);
        if (result) {
          this._tryNext(value, result);
        }
      } catch (err) {
        this.destination.error(err);
      }
    };
    DebounceSubscriber.prototype._complete = function() {
      this.emitValue();
      this.destination.complete();
    };
    DebounceSubscriber.prototype._tryNext = function(value, duration) {
      var subscription = this.durationSubscription;
      this.value = value;
      this.hasValue = true;
      if (subscription) {
        subscription.unsubscribe();
        this.remove(subscription);
      }
      subscription = subscribeToResult_1.subscribeToResult(this, duration);
      if (!subscription.isUnsubscribed) {
        this.add(this.durationSubscription = subscription);
      }
    };
    DebounceSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.emitValue();
    };
    DebounceSubscriber.prototype.notifyComplete = function() {
      this.emitValue();
    };
    DebounceSubscriber.prototype.emitValue = function() {
      if (this.hasValue) {
        var value = this.value;
        var subscription = this.durationSubscription;
        if (subscription) {
          this.durationSubscription = null;
          subscription.unsubscribe();
          this.remove(subscription);
        }
        this.value = null;
        this.hasValue = false;
        _super.prototype._next.call(this, value);
      }
    };
    return DebounceSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/debounceTime", ["rxjs/Subscriber", "rxjs/scheduler/async"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var async_1 = require("rxjs/scheduler/async");
  function debounceTime(dueTime, scheduler) {
    if (scheduler === void 0) {
      scheduler = async_1.async;
    }
    return this.lift(new DebounceTimeOperator(dueTime, scheduler));
  }
  exports.debounceTime = debounceTime;
  var DebounceTimeOperator = (function() {
    function DebounceTimeOperator(dueTime, scheduler) {
      this.dueTime = dueTime;
      this.scheduler = scheduler;
    }
    DebounceTimeOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new DebounceTimeSubscriber(subscriber, this.dueTime, this.scheduler));
    };
    return DebounceTimeOperator;
  }());
  var DebounceTimeSubscriber = (function(_super) {
    __extends(DebounceTimeSubscriber, _super);
    function DebounceTimeSubscriber(destination, dueTime, scheduler) {
      _super.call(this, destination);
      this.dueTime = dueTime;
      this.scheduler = scheduler;
      this.debouncedSubscription = null;
      this.lastValue = null;
      this.hasValue = false;
    }
    DebounceTimeSubscriber.prototype._next = function(value) {
      this.clearDebounce();
      this.lastValue = value;
      this.hasValue = true;
      this.add(this.debouncedSubscription = this.scheduler.schedule(dispatchNext, this.dueTime, this));
    };
    DebounceTimeSubscriber.prototype._complete = function() {
      this.debouncedNext();
      this.destination.complete();
    };
    DebounceTimeSubscriber.prototype.debouncedNext = function() {
      this.clearDebounce();
      if (this.hasValue) {
        this.destination.next(this.lastValue);
        this.lastValue = null;
        this.hasValue = false;
      }
    };
    DebounceTimeSubscriber.prototype.clearDebounce = function() {
      var debouncedSubscription = this.debouncedSubscription;
      if (debouncedSubscription !== null) {
        this.remove(debouncedSubscription);
        debouncedSubscription.unsubscribe();
        this.debouncedSubscription = null;
      }
    };
    return DebounceTimeSubscriber;
  }(Subscriber_1.Subscriber));
  function dispatchNext(subscriber) {
    subscriber.debouncedNext();
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/defaultIfEmpty", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function defaultIfEmpty(defaultValue) {
    if (defaultValue === void 0) {
      defaultValue = null;
    }
    return this.lift(new DefaultIfEmptyOperator(defaultValue));
  }
  exports.defaultIfEmpty = defaultIfEmpty;
  var DefaultIfEmptyOperator = (function() {
    function DefaultIfEmptyOperator(defaultValue) {
      this.defaultValue = defaultValue;
    }
    DefaultIfEmptyOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new DefaultIfEmptySubscriber(subscriber, this.defaultValue));
    };
    return DefaultIfEmptyOperator;
  }());
  var DefaultIfEmptySubscriber = (function(_super) {
    __extends(DefaultIfEmptySubscriber, _super);
    function DefaultIfEmptySubscriber(destination, defaultValue) {
      _super.call(this, destination);
      this.defaultValue = defaultValue;
      this.isEmpty = true;
    }
    DefaultIfEmptySubscriber.prototype._next = function(value) {
      this.isEmpty = false;
      this.destination.next(value);
    };
    DefaultIfEmptySubscriber.prototype._complete = function() {
      if (this.isEmpty) {
        this.destination.next(this.defaultValue);
      }
      this.destination.complete();
    };
    return DefaultIfEmptySubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/delay", ["rxjs/scheduler/async", "rxjs/util/isDate", "rxjs/Subscriber", "rxjs/Notification"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var async_1 = require("rxjs/scheduler/async");
  var isDate_1 = require("rxjs/util/isDate");
  var Subscriber_1 = require("rxjs/Subscriber");
  var Notification_1 = require("rxjs/Notification");
  function delay(delay, scheduler) {
    if (scheduler === void 0) {
      scheduler = async_1.async;
    }
    var absoluteDelay = isDate_1.isDate(delay);
    var delayFor = absoluteDelay ? (+delay - scheduler.now()) : Math.abs(delay);
    return this.lift(new DelayOperator(delayFor, scheduler));
  }
  exports.delay = delay;
  var DelayOperator = (function() {
    function DelayOperator(delay, scheduler) {
      this.delay = delay;
      this.scheduler = scheduler;
    }
    DelayOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new DelaySubscriber(subscriber, this.delay, this.scheduler));
    };
    return DelayOperator;
  }());
  var DelaySubscriber = (function(_super) {
    __extends(DelaySubscriber, _super);
    function DelaySubscriber(destination, delay, scheduler) {
      _super.call(this, destination);
      this.delay = delay;
      this.scheduler = scheduler;
      this.queue = [];
      this.active = false;
      this.errored = false;
    }
    DelaySubscriber.dispatch = function(state) {
      var source = state.source;
      var queue = source.queue;
      var scheduler = state.scheduler;
      var destination = state.destination;
      while (queue.length > 0 && (queue[0].time - scheduler.now()) <= 0) {
        queue.shift().notification.observe(destination);
      }
      if (queue.length > 0) {
        var delay_1 = Math.max(0, queue[0].time - scheduler.now());
        this.schedule(state, delay_1);
      } else {
        source.active = false;
      }
    };
    DelaySubscriber.prototype._schedule = function(scheduler) {
      this.active = true;
      this.add(scheduler.schedule(DelaySubscriber.dispatch, this.delay, {
        source: this,
        destination: this.destination,
        scheduler: scheduler
      }));
    };
    DelaySubscriber.prototype.scheduleNotification = function(notification) {
      if (this.errored === true) {
        return ;
      }
      var scheduler = this.scheduler;
      var message = new DelayMessage(scheduler.now() + this.delay, notification);
      this.queue.push(message);
      if (this.active === false) {
        this._schedule(scheduler);
      }
    };
    DelaySubscriber.prototype._next = function(value) {
      this.scheduleNotification(Notification_1.Notification.createNext(value));
    };
    DelaySubscriber.prototype._error = function(err) {
      this.errored = true;
      this.queue = [];
      this.destination.error(err);
    };
    DelaySubscriber.prototype._complete = function() {
      this.scheduleNotification(Notification_1.Notification.createComplete());
    };
    return DelaySubscriber;
  }(Subscriber_1.Subscriber));
  var DelayMessage = (function() {
    function DelayMessage(time, notification) {
      this.time = time;
      this.notification = notification;
    }
    return DelayMessage;
  }());
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/delayWhen", ["rxjs/Subscriber", "rxjs/Observable", "rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var Observable_1 = require("rxjs/Observable");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function delayWhen(delayDurationSelector, subscriptionDelay) {
    if (subscriptionDelay) {
      return new SubscriptionDelayObservable(this, subscriptionDelay).lift(new DelayWhenOperator(delayDurationSelector));
    }
    return this.lift(new DelayWhenOperator(delayDurationSelector));
  }
  exports.delayWhen = delayWhen;
  var DelayWhenOperator = (function() {
    function DelayWhenOperator(delayDurationSelector) {
      this.delayDurationSelector = delayDurationSelector;
    }
    DelayWhenOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new DelayWhenSubscriber(subscriber, this.delayDurationSelector));
    };
    return DelayWhenOperator;
  }());
  var DelayWhenSubscriber = (function(_super) {
    __extends(DelayWhenSubscriber, _super);
    function DelayWhenSubscriber(destination, delayDurationSelector) {
      _super.call(this, destination);
      this.delayDurationSelector = delayDurationSelector;
      this.completed = false;
      this.delayNotifierSubscriptions = [];
      this.values = [];
    }
    DelayWhenSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.destination.next(outerValue);
      this.removeSubscription(innerSub);
      this.tryComplete();
    };
    DelayWhenSubscriber.prototype.notifyError = function(error, innerSub) {
      this._error(error);
    };
    DelayWhenSubscriber.prototype.notifyComplete = function(innerSub) {
      var value = this.removeSubscription(innerSub);
      if (value) {
        this.destination.next(value);
      }
      this.tryComplete();
    };
    DelayWhenSubscriber.prototype._next = function(value) {
      try {
        var delayNotifier = this.delayDurationSelector(value);
        if (delayNotifier) {
          this.tryDelay(delayNotifier, value);
        }
      } catch (err) {
        this.destination.error(err);
      }
    };
    DelayWhenSubscriber.prototype._complete = function() {
      this.completed = true;
      this.tryComplete();
    };
    DelayWhenSubscriber.prototype.removeSubscription = function(subscription) {
      subscription.unsubscribe();
      var subscriptionIdx = this.delayNotifierSubscriptions.indexOf(subscription);
      var value = null;
      if (subscriptionIdx !== -1) {
        value = this.values[subscriptionIdx];
        this.delayNotifierSubscriptions.splice(subscriptionIdx, 1);
        this.values.splice(subscriptionIdx, 1);
      }
      return value;
    };
    DelayWhenSubscriber.prototype.tryDelay = function(delayNotifier, value) {
      var notifierSubscription = subscribeToResult_1.subscribeToResult(this, delayNotifier, value);
      this.add(notifierSubscription);
      this.delayNotifierSubscriptions.push(notifierSubscription);
      this.values.push(value);
    };
    DelayWhenSubscriber.prototype.tryComplete = function() {
      if (this.completed && this.delayNotifierSubscriptions.length === 0) {
        this.destination.complete();
      }
    };
    return DelayWhenSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  var SubscriptionDelayObservable = (function(_super) {
    __extends(SubscriptionDelayObservable, _super);
    function SubscriptionDelayObservable(source, subscriptionDelay) {
      _super.call(this);
      this.source = source;
      this.subscriptionDelay = subscriptionDelay;
    }
    SubscriptionDelayObservable.prototype._subscribe = function(subscriber) {
      this.subscriptionDelay.subscribe(new SubscriptionDelaySubscriber(subscriber, this.source));
    };
    return SubscriptionDelayObservable;
  }(Observable_1.Observable));
  var SubscriptionDelaySubscriber = (function(_super) {
    __extends(SubscriptionDelaySubscriber, _super);
    function SubscriptionDelaySubscriber(parent, source) {
      _super.call(this);
      this.parent = parent;
      this.source = source;
      this.sourceSubscribed = false;
    }
    SubscriptionDelaySubscriber.prototype._next = function(unused) {
      this.subscribeToSource();
    };
    SubscriptionDelaySubscriber.prototype._error = function(err) {
      this.unsubscribe();
      this.parent.error(err);
    };
    SubscriptionDelaySubscriber.prototype._complete = function() {
      this.subscribeToSource();
    };
    SubscriptionDelaySubscriber.prototype.subscribeToSource = function() {
      if (!this.sourceSubscribed) {
        this.sourceSubscribed = true;
        this.unsubscribe();
        this.source.subscribe(this.parent);
      }
    };
    return SubscriptionDelaySubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/distinctUntilChanged", ["rxjs/Subscriber", "rxjs/util/tryCatch", "rxjs/util/errorObject"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var tryCatch_1 = require("rxjs/util/tryCatch");
  var errorObject_1 = require("rxjs/util/errorObject");
  function distinctUntilChanged(compare, keySelector) {
    return this.lift(new DistinctUntilChangedOperator(compare, keySelector));
  }
  exports.distinctUntilChanged = distinctUntilChanged;
  var DistinctUntilChangedOperator = (function() {
    function DistinctUntilChangedOperator(compare, keySelector) {
      this.compare = compare;
      this.keySelector = keySelector;
    }
    DistinctUntilChangedOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new DistinctUntilChangedSubscriber(subscriber, this.compare, this.keySelector));
    };
    return DistinctUntilChangedOperator;
  }());
  var DistinctUntilChangedSubscriber = (function(_super) {
    __extends(DistinctUntilChangedSubscriber, _super);
    function DistinctUntilChangedSubscriber(destination, compare, keySelector) {
      _super.call(this, destination);
      this.keySelector = keySelector;
      this.hasKey = false;
      if (typeof compare === 'function') {
        this.compare = compare;
      }
    }
    DistinctUntilChangedSubscriber.prototype.compare = function(x, y) {
      return x === y;
    };
    DistinctUntilChangedSubscriber.prototype._next = function(value) {
      var keySelector = this.keySelector;
      var key = value;
      if (keySelector) {
        key = tryCatch_1.tryCatch(this.keySelector)(value);
        if (key === errorObject_1.errorObject) {
          return this.destination.error(errorObject_1.errorObject.e);
        }
      }
      var result = false;
      if (this.hasKey) {
        result = tryCatch_1.tryCatch(this.compare)(this.key, key);
        if (result === errorObject_1.errorObject) {
          return this.destination.error(errorObject_1.errorObject.e);
        }
      } else {
        this.hasKey = true;
      }
      if (Boolean(result) === false) {
        this.key = key;
        this.destination.next(value);
      }
    };
    return DistinctUntilChangedSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/do", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function _do(nextOrObserver, error, complete) {
    return this.lift(new DoOperator(nextOrObserver, error, complete));
  }
  exports._do = _do;
  var DoOperator = (function() {
    function DoOperator(nextOrObserver, error, complete) {
      this.nextOrObserver = nextOrObserver;
      this.error = error;
      this.complete = complete;
    }
    DoOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new DoSubscriber(subscriber, this.nextOrObserver, this.error, this.complete));
    };
    return DoOperator;
  }());
  var DoSubscriber = (function(_super) {
    __extends(DoSubscriber, _super);
    function DoSubscriber(destination, nextOrObserver, error, complete) {
      _super.call(this, destination);
      var safeSubscriber = new Subscriber_1.Subscriber(nextOrObserver, error, complete);
      safeSubscriber.syncErrorThrowable = true;
      this.add(safeSubscriber);
      this.safeSubscriber = safeSubscriber;
    }
    DoSubscriber.prototype._next = function(value) {
      var safeSubscriber = this.safeSubscriber;
      safeSubscriber.next(value);
      if (safeSubscriber.syncErrorThrown) {
        this.destination.error(safeSubscriber.syncErrorValue);
      } else {
        this.destination.next(value);
      }
    };
    DoSubscriber.prototype._error = function(err) {
      var safeSubscriber = this.safeSubscriber;
      safeSubscriber.error(err);
      if (safeSubscriber.syncErrorThrown) {
        this.destination.error(safeSubscriber.syncErrorValue);
      } else {
        this.destination.error(err);
      }
    };
    DoSubscriber.prototype._complete = function() {
      var safeSubscriber = this.safeSubscriber;
      safeSubscriber.complete();
      if (safeSubscriber.syncErrorThrown) {
        this.destination.error(safeSubscriber.syncErrorValue);
      } else {
        this.destination.complete();
      }
    };
    return DoSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/expand", ["rxjs/util/tryCatch", "rxjs/util/errorObject", "rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var tryCatch_1 = require("rxjs/util/tryCatch");
  var errorObject_1 = require("rxjs/util/errorObject");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function expand(project, concurrent, scheduler) {
    if (concurrent === void 0) {
      concurrent = Number.POSITIVE_INFINITY;
    }
    if (scheduler === void 0) {
      scheduler = undefined;
    }
    concurrent = (concurrent || 0) < 1 ? Number.POSITIVE_INFINITY : concurrent;
    return this.lift(new ExpandOperator(project, concurrent, scheduler));
  }
  exports.expand = expand;
  var ExpandOperator = (function() {
    function ExpandOperator(project, concurrent, scheduler) {
      this.project = project;
      this.concurrent = concurrent;
      this.scheduler = scheduler;
    }
    ExpandOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new ExpandSubscriber(subscriber, this.project, this.concurrent, this.scheduler));
    };
    return ExpandOperator;
  }());
  exports.ExpandOperator = ExpandOperator;
  var ExpandSubscriber = (function(_super) {
    __extends(ExpandSubscriber, _super);
    function ExpandSubscriber(destination, project, concurrent, scheduler) {
      _super.call(this, destination);
      this.project = project;
      this.concurrent = concurrent;
      this.scheduler = scheduler;
      this.index = 0;
      this.active = 0;
      this.hasCompleted = false;
      if (concurrent < Number.POSITIVE_INFINITY) {
        this.buffer = [];
      }
    }
    ExpandSubscriber.dispatch = function(arg) {
      var subscriber = arg.subscriber,
          result = arg.result,
          value = arg.value,
          index = arg.index;
      subscriber.subscribeToProjection(result, value, index);
    };
    ExpandSubscriber.prototype._next = function(value) {
      var destination = this.destination;
      if (destination.isUnsubscribed) {
        this._complete();
        return ;
      }
      var index = this.index++;
      if (this.active < this.concurrent) {
        destination.next(value);
        var result = tryCatch_1.tryCatch(this.project)(value, index);
        if (result === errorObject_1.errorObject) {
          destination.error(errorObject_1.errorObject.e);
        } else if (!this.scheduler) {
          this.subscribeToProjection(result, value, index);
        } else {
          var state = {
            subscriber: this,
            result: result,
            value: value,
            index: index
          };
          this.add(this.scheduler.schedule(ExpandSubscriber.dispatch, 0, state));
        }
      } else {
        this.buffer.push(value);
      }
    };
    ExpandSubscriber.prototype.subscribeToProjection = function(result, value, index) {
      this.active++;
      this.add(subscribeToResult_1.subscribeToResult(this, result, value, index));
    };
    ExpandSubscriber.prototype._complete = function() {
      this.hasCompleted = true;
      if (this.hasCompleted && this.active === 0) {
        this.destination.complete();
      }
    };
    ExpandSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this._next(innerValue);
    };
    ExpandSubscriber.prototype.notifyComplete = function(innerSub) {
      var buffer = this.buffer;
      this.remove(innerSub);
      this.active--;
      if (buffer && buffer.length > 0) {
        this._next(buffer.shift());
      }
      if (this.hasCompleted && this.active === 0) {
        this.destination.complete();
      }
    };
    return ExpandSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  exports.ExpandSubscriber = ExpandSubscriber;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/filter", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function filter(predicate, thisArg) {
    return this.lift(new FilterOperator(predicate, thisArg));
  }
  exports.filter = filter;
  var FilterOperator = (function() {
    function FilterOperator(predicate, thisArg) {
      this.predicate = predicate;
      this.thisArg = thisArg;
    }
    FilterOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new FilterSubscriber(subscriber, this.predicate, this.thisArg));
    };
    return FilterOperator;
  }());
  var FilterSubscriber = (function(_super) {
    __extends(FilterSubscriber, _super);
    function FilterSubscriber(destination, predicate, thisArg) {
      _super.call(this, destination);
      this.predicate = predicate;
      this.thisArg = thisArg;
      this.count = 0;
      this.predicate = predicate;
    }
    FilterSubscriber.prototype._next = function(value) {
      var result;
      try {
        result = this.predicate.call(this.thisArg, value, this.count++);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      if (result) {
        this.destination.next(value);
      }
    };
    return FilterSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/finally", ["rxjs/Subscriber", "rxjs/Subscription"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var Subscription_1 = require("rxjs/Subscription");
  function _finally(finallySelector) {
    return this.lift(new FinallyOperator(finallySelector));
  }
  exports._finally = _finally;
  var FinallyOperator = (function() {
    function FinallyOperator(finallySelector) {
      this.finallySelector = finallySelector;
    }
    FinallyOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new FinallySubscriber(subscriber, this.finallySelector));
    };
    return FinallyOperator;
  }());
  var FinallySubscriber = (function(_super) {
    __extends(FinallySubscriber, _super);
    function FinallySubscriber(destination, finallySelector) {
      _super.call(this, destination);
      this.add(new Subscription_1.Subscription(finallySelector));
    }
    return FinallySubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/EmptyError", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var EmptyError = (function(_super) {
    __extends(EmptyError, _super);
    function EmptyError() {
      _super.call(this, 'no elements in sequence');
      this.name = 'EmptyError';
    }
    return EmptyError;
  }(Error));
  exports.EmptyError = EmptyError;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/MapPolyfill", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var MapPolyfill = (function() {
    function MapPolyfill() {
      this.size = 0;
      this._values = [];
      this._keys = [];
    }
    MapPolyfill.prototype.get = function(key) {
      var i = this._keys.indexOf(key);
      return i === -1 ? undefined : this._values[i];
    };
    MapPolyfill.prototype.set = function(key, value) {
      var i = this._keys.indexOf(key);
      if (i === -1) {
        this._keys.push(key);
        this._values.push(value);
        this.size++;
      } else {
        this._values[i] = value;
      }
      return this;
    };
    MapPolyfill.prototype.delete = function(key) {
      var i = this._keys.indexOf(key);
      if (i === -1) {
        return false;
      }
      this._values.splice(i, 1);
      this._keys.splice(i, 1);
      this.size--;
      return true;
    };
    MapPolyfill.prototype.clear = function() {
      this._keys.length = 0;
      this._values.length = 0;
      this.size = 0;
    };
    MapPolyfill.prototype.forEach = function(cb, thisArg) {
      for (var i = 0; i < this.size; i++) {
        cb.call(thisArg, this._values[i], this._keys[i]);
      }
    };
    return MapPolyfill;
  }());
  exports.MapPolyfill = MapPolyfill;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/FastMap", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var FastMap = (function() {
    function FastMap() {
      this.values = {};
    }
    FastMap.prototype.delete = function(key) {
      this.values[key] = null;
      return true;
    };
    FastMap.prototype.set = function(key, value) {
      this.values[key] = value;
      return this;
    };
    FastMap.prototype.get = function(key) {
      return this.values[key];
    };
    FastMap.prototype.forEach = function(cb, thisArg) {
      var values = this.values;
      for (var key in values) {
        if (values.hasOwnProperty(key) && values[key] !== null) {
          cb.call(thisArg, values[key], key);
        }
      }
    };
    FastMap.prototype.clear = function() {
      this.values = {};
    };
    return FastMap;
  }());
  exports.FastMap = FastMap;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/ignoreElements", ["rxjs/Subscriber", "rxjs/util/noop"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var noop_1 = require("rxjs/util/noop");
  function ignoreElements() {
    return this.lift(new IgnoreElementsOperator());
  }
  exports.ignoreElements = ignoreElements;
  ;
  var IgnoreElementsOperator = (function() {
    function IgnoreElementsOperator() {}
    IgnoreElementsOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new IgnoreElementsSubscriber(subscriber));
    };
    return IgnoreElementsOperator;
  }());
  var IgnoreElementsSubscriber = (function(_super) {
    __extends(IgnoreElementsSubscriber, _super);
    function IgnoreElementsSubscriber() {
      _super.apply(this, arguments);
    }
    IgnoreElementsSubscriber.prototype._next = function(unused) {
      noop_1.noop();
    };
    return IgnoreElementsSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/audit", ["rxjs/util/tryCatch", "rxjs/util/errorObject", "rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var tryCatch_1 = require("rxjs/util/tryCatch");
  var errorObject_1 = require("rxjs/util/errorObject");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function audit(durationSelector) {
    return this.lift(new AuditOperator(durationSelector));
  }
  exports.audit = audit;
  var AuditOperator = (function() {
    function AuditOperator(durationSelector) {
      this.durationSelector = durationSelector;
    }
    AuditOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new AuditSubscriber(subscriber, this.durationSelector));
    };
    return AuditOperator;
  }());
  var AuditSubscriber = (function(_super) {
    __extends(AuditSubscriber, _super);
    function AuditSubscriber(destination, durationSelector) {
      _super.call(this, destination);
      this.durationSelector = durationSelector;
      this.hasValue = false;
    }
    AuditSubscriber.prototype._next = function(value) {
      this.value = value;
      this.hasValue = true;
      if (!this.throttled) {
        var duration = tryCatch_1.tryCatch(this.durationSelector)(value);
        if (duration === errorObject_1.errorObject) {
          this.destination.error(errorObject_1.errorObject.e);
        } else {
          this.add(this.throttled = subscribeToResult_1.subscribeToResult(this, duration));
        }
      }
    };
    AuditSubscriber.prototype.clearThrottle = function() {
      var _a = this,
          value = _a.value,
          hasValue = _a.hasValue,
          throttled = _a.throttled;
      if (throttled) {
        this.remove(throttled);
        this.throttled = null;
        throttled.unsubscribe();
      }
      if (hasValue) {
        this.value = null;
        this.hasValue = false;
        this.destination.next(value);
      }
    };
    AuditSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex) {
      this.clearThrottle();
    };
    AuditSubscriber.prototype.notifyComplete = function() {
      this.clearThrottle();
    };
    return AuditSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/auditTime", ["rxjs/scheduler/async", "rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var async_1 = require("rxjs/scheduler/async");
  var Subscriber_1 = require("rxjs/Subscriber");
  function auditTime(delay, scheduler) {
    if (scheduler === void 0) {
      scheduler = async_1.async;
    }
    return this.lift(new AuditTimeOperator(delay, scheduler));
  }
  exports.auditTime = auditTime;
  var AuditTimeOperator = (function() {
    function AuditTimeOperator(delay, scheduler) {
      this.delay = delay;
      this.scheduler = scheduler;
    }
    AuditTimeOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new AuditTimeSubscriber(subscriber, this.delay, this.scheduler));
    };
    return AuditTimeOperator;
  }());
  var AuditTimeSubscriber = (function(_super) {
    __extends(AuditTimeSubscriber, _super);
    function AuditTimeSubscriber(destination, delay, scheduler) {
      _super.call(this, destination);
      this.delay = delay;
      this.scheduler = scheduler;
      this.hasValue = false;
    }
    AuditTimeSubscriber.prototype._next = function(value) {
      this.value = value;
      this.hasValue = true;
      if (!this.throttled) {
        this.add(this.throttled = this.scheduler.schedule(dispatchNext, this.delay, this));
      }
    };
    AuditTimeSubscriber.prototype.clearThrottle = function() {
      var _a = this,
          value = _a.value,
          hasValue = _a.hasValue,
          throttled = _a.throttled;
      if (throttled) {
        this.remove(throttled);
        this.throttled = null;
        throttled.unsubscribe();
      }
      if (hasValue) {
        this.value = null;
        this.hasValue = false;
        this.destination.next(value);
      }
    };
    return AuditTimeSubscriber;
  }(Subscriber_1.Subscriber));
  function dispatchNext(subscriber) {
    subscriber.clearThrottle();
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/last", ["rxjs/Subscriber", "rxjs/util/EmptyError"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var EmptyError_1 = require("rxjs/util/EmptyError");
  function last(predicate, resultSelector, defaultValue) {
    return this.lift(new LastOperator(predicate, resultSelector, defaultValue, this));
  }
  exports.last = last;
  var LastOperator = (function() {
    function LastOperator(predicate, resultSelector, defaultValue, source) {
      this.predicate = predicate;
      this.resultSelector = resultSelector;
      this.defaultValue = defaultValue;
      this.source = source;
    }
    LastOperator.prototype.call = function(observer, source) {
      return source._subscribe(new LastSubscriber(observer, this.predicate, this.resultSelector, this.defaultValue, this.source));
    };
    return LastOperator;
  }());
  var LastSubscriber = (function(_super) {
    __extends(LastSubscriber, _super);
    function LastSubscriber(destination, predicate, resultSelector, defaultValue, source) {
      _super.call(this, destination);
      this.predicate = predicate;
      this.resultSelector = resultSelector;
      this.defaultValue = defaultValue;
      this.source = source;
      this.hasValue = false;
      this.index = 0;
      if (typeof defaultValue !== 'undefined') {
        this.lastValue = defaultValue;
        this.hasValue = true;
      }
    }
    LastSubscriber.prototype._next = function(value) {
      var index = this.index++;
      if (this.predicate) {
        this._tryPredicate(value, index);
      } else {
        if (this.resultSelector) {
          this._tryResultSelector(value, index);
          return ;
        }
        this.lastValue = value;
        this.hasValue = true;
      }
    };
    LastSubscriber.prototype._tryPredicate = function(value, index) {
      var result;
      try {
        result = this.predicate(value, index, this.source);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      if (result) {
        if (this.resultSelector) {
          this._tryResultSelector(value, index);
          return ;
        }
        this.lastValue = value;
        this.hasValue = true;
      }
    };
    LastSubscriber.prototype._tryResultSelector = function(value, index) {
      var result;
      try {
        result = this.resultSelector(value, index);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      this.lastValue = result;
      this.hasValue = true;
    };
    LastSubscriber.prototype._complete = function() {
      var destination = this.destination;
      if (this.hasValue) {
        destination.next(this.lastValue);
        destination.complete();
      } else {
        destination.error(new EmptyError_1.EmptyError);
      }
    };
    return LastSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/let", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  function letProto(func) {
    return func(this);
  }
  exports.letProto = letProto;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/every", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function every(predicate, thisArg) {
    var source = this;
    return source.lift(new EveryOperator(predicate, thisArg, source));
  }
  exports.every = every;
  var EveryOperator = (function() {
    function EveryOperator(predicate, thisArg, source) {
      this.predicate = predicate;
      this.thisArg = thisArg;
      this.source = source;
    }
    EveryOperator.prototype.call = function(observer, source) {
      return source._subscribe(new EverySubscriber(observer, this.predicate, this.thisArg, this.source));
    };
    return EveryOperator;
  }());
  var EverySubscriber = (function(_super) {
    __extends(EverySubscriber, _super);
    function EverySubscriber(destination, predicate, thisArg, source) {
      _super.call(this, destination);
      this.predicate = predicate;
      this.thisArg = thisArg;
      this.source = source;
      this.index = 0;
      this.thisArg = thisArg || this;
    }
    EverySubscriber.prototype.notifyComplete = function(everyValueMatch) {
      this.destination.next(everyValueMatch);
      this.destination.complete();
    };
    EverySubscriber.prototype._next = function(value) {
      var result = false;
      try {
        result = this.predicate.call(this.thisArg, value, this.index++, this.source);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      if (!result) {
        this.notifyComplete(false);
      }
    };
    EverySubscriber.prototype._complete = function() {
      this.notifyComplete(true);
    };
    return EverySubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/map", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function map(project, thisArg) {
    if (typeof project !== 'function') {
      throw new TypeError('argument is not a function. Are you looking for `mapTo()`?');
    }
    return this.lift(new MapOperator(project, thisArg));
  }
  exports.map = map;
  var MapOperator = (function() {
    function MapOperator(project, thisArg) {
      this.project = project;
      this.thisArg = thisArg;
    }
    MapOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new MapSubscriber(subscriber, this.project, this.thisArg));
    };
    return MapOperator;
  }());
  var MapSubscriber = (function(_super) {
    __extends(MapSubscriber, _super);
    function MapSubscriber(destination, project, thisArg) {
      _super.call(this, destination);
      this.project = project;
      this.count = 0;
      this.thisArg = thisArg || this;
    }
    MapSubscriber.prototype._next = function(value) {
      var result;
      try {
        result = this.project.call(this.thisArg, value, this.count++);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      this.destination.next(result);
    };
    return MapSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/mapTo", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function mapTo(value) {
    return this.lift(new MapToOperator(value));
  }
  exports.mapTo = mapTo;
  var MapToOperator = (function() {
    function MapToOperator(value) {
      this.value = value;
    }
    MapToOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new MapToSubscriber(subscriber, this.value));
    };
    return MapToOperator;
  }());
  var MapToSubscriber = (function(_super) {
    __extends(MapToSubscriber, _super);
    function MapToSubscriber(destination, value) {
      _super.call(this, destination);
      this.value = value;
    }
    MapToSubscriber.prototype._next = function(x) {
      this.destination.next(this.value);
    };
    return MapToSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/materialize", ["rxjs/Subscriber", "rxjs/Notification"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var Notification_1 = require("rxjs/Notification");
  function materialize() {
    return this.lift(new MaterializeOperator());
  }
  exports.materialize = materialize;
  var MaterializeOperator = (function() {
    function MaterializeOperator() {}
    MaterializeOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new MaterializeSubscriber(subscriber));
    };
    return MaterializeOperator;
  }());
  var MaterializeSubscriber = (function(_super) {
    __extends(MaterializeSubscriber, _super);
    function MaterializeSubscriber(destination) {
      _super.call(this, destination);
    }
    MaterializeSubscriber.prototype._next = function(value) {
      this.destination.next(Notification_1.Notification.createNext(value));
    };
    MaterializeSubscriber.prototype._error = function(err) {
      var destination = this.destination;
      destination.next(Notification_1.Notification.createError(err));
      destination.complete();
    };
    MaterializeSubscriber.prototype._complete = function() {
      var destination = this.destination;
      destination.next(Notification_1.Notification.createComplete());
      destination.complete();
    };
    return MaterializeSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/merge", ["rxjs/Observable", "rxjs/operator/merge"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var merge_1 = require("rxjs/operator/merge");
  Observable_1.Observable.prototype.merge = merge_1.merge;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/mergeAll", ["rxjs/Observable", "rxjs/operator/mergeAll"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var mergeAll_1 = require("rxjs/operator/mergeAll");
  Observable_1.Observable.prototype.mergeAll = mergeAll_1.mergeAll;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/mergeMap", ["rxjs/Observable", "rxjs/operator/mergeMap"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var mergeMap_1 = require("rxjs/operator/mergeMap");
  Observable_1.Observable.prototype.mergeMap = mergeMap_1.mergeMap;
  Observable_1.Observable.prototype.flatMap = mergeMap_1.mergeMap;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/mergeMapTo", ["rxjs/Observable", "rxjs/operator/mergeMapTo"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var mergeMapTo_1 = require("rxjs/operator/mergeMapTo");
  Observable_1.Observable.prototype.flatMapTo = mergeMapTo_1.mergeMapTo;
  Observable_1.Observable.prototype.mergeMapTo = mergeMapTo_1.mergeMapTo;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/multicast", ["rxjs/Observable", "rxjs/operator/multicast"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var multicast_1 = require("rxjs/operator/multicast");
  Observable_1.Observable.prototype.multicast = multicast_1.multicast;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/observeOn", ["rxjs/Observable", "rxjs/operator/observeOn"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var observeOn_1 = require("rxjs/operator/observeOn");
  Observable_1.Observable.prototype.observeOn = observeOn_1.observeOn;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/not", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  function not(pred, thisArg) {
    function notPred() {
      return !(notPred.pred.apply(notPred.thisArg, arguments));
    }
    notPred.pred = pred;
    notPred.thisArg = thisArg;
    return notPred;
  }
  exports.not = not;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/pluck", ["rxjs/operator/map"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var map_1 = require("rxjs/operator/map");
  function pluck() {
    var properties = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      properties[_i - 0] = arguments[_i];
    }
    var length = properties.length;
    if (length === 0) {
      throw new Error('List of properties cannot be empty.');
    }
    return map_1.map.call(this, plucker(properties, length));
  }
  exports.pluck = pluck;
  function plucker(props, length) {
    var mapper = function(x) {
      var currentProp = x;
      for (var i = 0; i < length; i++) {
        var p = currentProp[props[i]];
        if (typeof p !== 'undefined') {
          currentProp = p;
        } else {
          return undefined;
        }
      }
      return currentProp;
    };
    return mapper;
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/publish", ["rxjs/Subject", "rxjs/operator/multicast"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Subject_1 = require("rxjs/Subject");
  var multicast_1 = require("rxjs/operator/multicast");
  function publish() {
    return multicast_1.multicast.call(this, new Subject_1.Subject());
  }
  exports.publish = publish;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/BehaviorSubject", ["rxjs/Subject", "rxjs/util/throwError", "rxjs/util/ObjectUnsubscribedError"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subject_1 = require("rxjs/Subject");
  var throwError_1 = require("rxjs/util/throwError");
  var ObjectUnsubscribedError_1 = require("rxjs/util/ObjectUnsubscribedError");
  var BehaviorSubject = (function(_super) {
    __extends(BehaviorSubject, _super);
    function BehaviorSubject(_value) {
      _super.call(this);
      this._value = _value;
    }
    BehaviorSubject.prototype.getValue = function() {
      if (this.hasErrored) {
        throwError_1.throwError(this.errorValue);
      } else if (this.isUnsubscribed) {
        throwError_1.throwError(new ObjectUnsubscribedError_1.ObjectUnsubscribedError());
      } else {
        return this._value;
      }
    };
    Object.defineProperty(BehaviorSubject.prototype, "value", {
      get: function() {
        return this.getValue();
      },
      enumerable: true,
      configurable: true
    });
    BehaviorSubject.prototype._subscribe = function(subscriber) {
      var subscription = _super.prototype._subscribe.call(this, subscriber);
      if (subscription && !subscription.isUnsubscribed) {
        subscriber.next(this._value);
      }
      return subscription;
    };
    BehaviorSubject.prototype._next = function(value) {
      _super.prototype._next.call(this, this._value = value);
    };
    BehaviorSubject.prototype._error = function(err) {
      this.hasErrored = true;
      _super.prototype._error.call(this, this.errorValue = err);
    };
    return BehaviorSubject;
  }(Subject_1.Subject));
  exports.BehaviorSubject = BehaviorSubject;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/publishReplay", ["rxjs/Observable", "rxjs/operator/publishReplay"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var publishReplay_1 = require("rxjs/operator/publishReplay");
  Observable_1.Observable.prototype.publishReplay = publishReplay_1.publishReplay;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/publishLast", ["rxjs/AsyncSubject", "rxjs/operator/multicast"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var AsyncSubject_1 = require("rxjs/AsyncSubject");
  var multicast_1 = require("rxjs/operator/multicast");
  function publishLast() {
    return multicast_1.multicast.call(this, new AsyncSubject_1.AsyncSubject());
  }
  exports.publishLast = publishLast;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/race", ["rxjs/Observable", "rxjs/operator/race"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var race_1 = require("rxjs/operator/race");
  Observable_1.Observable.prototype.race = race_1.race;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/reduce", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function reduce(project, seed) {
    return this.lift(new ReduceOperator(project, seed));
  }
  exports.reduce = reduce;
  var ReduceOperator = (function() {
    function ReduceOperator(project, seed) {
      this.project = project;
      this.seed = seed;
    }
    ReduceOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new ReduceSubscriber(subscriber, this.project, this.seed));
    };
    return ReduceOperator;
  }());
  exports.ReduceOperator = ReduceOperator;
  var ReduceSubscriber = (function(_super) {
    __extends(ReduceSubscriber, _super);
    function ReduceSubscriber(destination, project, seed) {
      _super.call(this, destination);
      this.hasValue = false;
      this.acc = seed;
      this.project = project;
      this.hasSeed = typeof seed !== 'undefined';
    }
    ReduceSubscriber.prototype._next = function(value) {
      if (this.hasValue || (this.hasValue = this.hasSeed)) {
        this._tryReduce(value);
      } else {
        this.acc = value;
        this.hasValue = true;
      }
    };
    ReduceSubscriber.prototype._tryReduce = function(value) {
      var result;
      try {
        result = this.project(this.acc, value);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      this.acc = result;
    };
    ReduceSubscriber.prototype._complete = function() {
      if (this.hasValue || this.hasSeed) {
        this.destination.next(this.acc);
      }
      this.destination.complete();
    };
    return ReduceSubscriber;
  }(Subscriber_1.Subscriber));
  exports.ReduceSubscriber = ReduceSubscriber;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/repeat", ["rxjs/Subscriber", "rxjs/observable/EmptyObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var EmptyObservable_1 = require("rxjs/observable/EmptyObservable");
  function repeat(count) {
    if (count === void 0) {
      count = -1;
    }
    if (count === 0) {
      return new EmptyObservable_1.EmptyObservable();
    } else if (count < 0) {
      return this.lift(new RepeatOperator(-1, this));
    } else {
      return this.lift(new RepeatOperator(count - 1, this));
    }
  }
  exports.repeat = repeat;
  var RepeatOperator = (function() {
    function RepeatOperator(count, source) {
      this.count = count;
      this.source = source;
    }
    RepeatOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new RepeatSubscriber(subscriber, this.count, this.source));
    };
    return RepeatOperator;
  }());
  var RepeatSubscriber = (function(_super) {
    __extends(RepeatSubscriber, _super);
    function RepeatSubscriber(destination, count, source) {
      _super.call(this, destination);
      this.count = count;
      this.source = source;
    }
    RepeatSubscriber.prototype.complete = function() {
      if (!this.isStopped) {
        var _a = this,
            source = _a.source,
            count = _a.count;
        if (count === 0) {
          return _super.prototype.complete.call(this);
        } else if (count > -1) {
          this.count = count - 1;
        }
        this.unsubscribe();
        this.isStopped = false;
        this.isUnsubscribed = false;
        source.subscribe(this);
      }
    };
    return RepeatSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/retry", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function retry(count) {
    if (count === void 0) {
      count = -1;
    }
    return this.lift(new RetryOperator(count, this));
  }
  exports.retry = retry;
  var RetryOperator = (function() {
    function RetryOperator(count, source) {
      this.count = count;
      this.source = source;
    }
    RetryOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new RetrySubscriber(subscriber, this.count, this.source));
    };
    return RetryOperator;
  }());
  var RetrySubscriber = (function(_super) {
    __extends(RetrySubscriber, _super);
    function RetrySubscriber(destination, count, source) {
      _super.call(this, destination);
      this.count = count;
      this.source = source;
    }
    RetrySubscriber.prototype.error = function(err) {
      if (!this.isStopped) {
        var _a = this,
            source = _a.source,
            count = _a.count;
        if (count === 0) {
          return _super.prototype.error.call(this, err);
        } else if (count > -1) {
          this.count = count - 1;
        }
        this.unsubscribe();
        this.isStopped = false;
        this.isUnsubscribed = false;
        source.subscribe(this);
      }
    };
    return RetrySubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/retryWhen", ["rxjs/Subject", "rxjs/util/tryCatch", "rxjs/util/errorObject", "rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subject_1 = require("rxjs/Subject");
  var tryCatch_1 = require("rxjs/util/tryCatch");
  var errorObject_1 = require("rxjs/util/errorObject");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function retryWhen(notifier) {
    return this.lift(new RetryWhenOperator(notifier, this));
  }
  exports.retryWhen = retryWhen;
  var RetryWhenOperator = (function() {
    function RetryWhenOperator(notifier, source) {
      this.notifier = notifier;
      this.source = source;
    }
    RetryWhenOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new RetryWhenSubscriber(subscriber, this.notifier, this.source));
    };
    return RetryWhenOperator;
  }());
  var RetryWhenSubscriber = (function(_super) {
    __extends(RetryWhenSubscriber, _super);
    function RetryWhenSubscriber(destination, notifier, source) {
      _super.call(this, destination);
      this.notifier = notifier;
      this.source = source;
    }
    RetryWhenSubscriber.prototype.error = function(err) {
      if (!this.isStopped) {
        var errors = this.errors;
        var retries = this.retries;
        var retriesSubscription = this.retriesSubscription;
        if (!retries) {
          errors = new Subject_1.Subject();
          retries = tryCatch_1.tryCatch(this.notifier)(errors);
          if (retries === errorObject_1.errorObject) {
            return _super.prototype.error.call(this, errorObject_1.errorObject.e);
          }
          retriesSubscription = subscribeToResult_1.subscribeToResult(this, retries);
        } else {
          this.errors = null;
          this.retriesSubscription = null;
        }
        this.unsubscribe();
        this.isUnsubscribed = false;
        this.errors = errors;
        this.retries = retries;
        this.retriesSubscription = retriesSubscription;
        errors.next(err);
      }
    };
    RetryWhenSubscriber.prototype._unsubscribe = function() {
      var _a = this,
          errors = _a.errors,
          retriesSubscription = _a.retriesSubscription;
      if (errors) {
        errors.unsubscribe();
        this.errors = null;
      }
      if (retriesSubscription) {
        retriesSubscription.unsubscribe();
        this.retriesSubscription = null;
      }
      this.retries = null;
    };
    RetryWhenSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      var _a = this,
          errors = _a.errors,
          retries = _a.retries,
          retriesSubscription = _a.retriesSubscription;
      this.errors = null;
      this.retries = null;
      this.retriesSubscription = null;
      this.unsubscribe();
      this.isStopped = false;
      this.isUnsubscribed = false;
      this.errors = errors;
      this.retries = retries;
      this.retriesSubscription = retriesSubscription;
      this.source.subscribe(this);
    };
    return RetryWhenSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/sample", ["rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function sample(notifier) {
    return this.lift(new SampleOperator(notifier));
  }
  exports.sample = sample;
  var SampleOperator = (function() {
    function SampleOperator(notifier) {
      this.notifier = notifier;
    }
    SampleOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new SampleSubscriber(subscriber, this.notifier));
    };
    return SampleOperator;
  }());
  var SampleSubscriber = (function(_super) {
    __extends(SampleSubscriber, _super);
    function SampleSubscriber(destination, notifier) {
      _super.call(this, destination);
      this.hasValue = false;
      this.add(subscribeToResult_1.subscribeToResult(this, notifier));
    }
    SampleSubscriber.prototype._next = function(value) {
      this.value = value;
      this.hasValue = true;
    };
    SampleSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.emitValue();
    };
    SampleSubscriber.prototype.notifyComplete = function() {
      this.emitValue();
    };
    SampleSubscriber.prototype.emitValue = function() {
      if (this.hasValue) {
        this.hasValue = false;
        this.destination.next(this.value);
      }
    };
    return SampleSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/sampleTime", ["rxjs/Subscriber", "rxjs/scheduler/async"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var async_1 = require("rxjs/scheduler/async");
  function sampleTime(delay, scheduler) {
    if (scheduler === void 0) {
      scheduler = async_1.async;
    }
    return this.lift(new SampleTimeOperator(delay, scheduler));
  }
  exports.sampleTime = sampleTime;
  var SampleTimeOperator = (function() {
    function SampleTimeOperator(delay, scheduler) {
      this.delay = delay;
      this.scheduler = scheduler;
    }
    SampleTimeOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new SampleTimeSubscriber(subscriber, this.delay, this.scheduler));
    };
    return SampleTimeOperator;
  }());
  var SampleTimeSubscriber = (function(_super) {
    __extends(SampleTimeSubscriber, _super);
    function SampleTimeSubscriber(destination, delay, scheduler) {
      _super.call(this, destination);
      this.delay = delay;
      this.scheduler = scheduler;
      this.hasValue = false;
      this.add(scheduler.schedule(dispatchNotification, delay, {
        subscriber: this,
        delay: delay
      }));
    }
    SampleTimeSubscriber.prototype._next = function(value) {
      this.lastValue = value;
      this.hasValue = true;
    };
    SampleTimeSubscriber.prototype.notifyNext = function() {
      if (this.hasValue) {
        this.hasValue = false;
        this.destination.next(this.lastValue);
      }
    };
    return SampleTimeSubscriber;
  }(Subscriber_1.Subscriber));
  function dispatchNotification(state) {
    var subscriber = state.subscriber,
        delay = state.delay;
    subscriber.notifyNext();
    this.schedule(state, delay);
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/scan", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function scan(accumulator, seed) {
    return this.lift(new ScanOperator(accumulator, seed));
  }
  exports.scan = scan;
  var ScanOperator = (function() {
    function ScanOperator(accumulator, seed) {
      this.accumulator = accumulator;
      this.seed = seed;
    }
    ScanOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new ScanSubscriber(subscriber, this.accumulator, this.seed));
    };
    return ScanOperator;
  }());
  var ScanSubscriber = (function(_super) {
    __extends(ScanSubscriber, _super);
    function ScanSubscriber(destination, accumulator, seed) {
      _super.call(this, destination);
      this.accumulator = accumulator;
      this.accumulatorSet = false;
      this.seed = seed;
      this.accumulator = accumulator;
      this.accumulatorSet = typeof seed !== 'undefined';
    }
    Object.defineProperty(ScanSubscriber.prototype, "seed", {
      get: function() {
        return this._seed;
      },
      set: function(value) {
        this.accumulatorSet = true;
        this._seed = value;
      },
      enumerable: true,
      configurable: true
    });
    ScanSubscriber.prototype._next = function(value) {
      if (!this.accumulatorSet) {
        this.seed = value;
        this.destination.next(value);
      } else {
        return this._tryNext(value);
      }
    };
    ScanSubscriber.prototype._tryNext = function(value) {
      var result;
      try {
        result = this.accumulator(this.seed, value);
      } catch (err) {
        this.destination.error(err);
      }
      this.seed = result;
      this.destination.next(result);
    };
    return ScanSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/share", ["rxjs/operator/multicast", "rxjs/Subject"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var multicast_1 = require("rxjs/operator/multicast");
  var Subject_1 = require("rxjs/Subject");
  function shareSubjectFactory() {
    return new Subject_1.Subject();
  }
  function share() {
    return multicast_1.multicast.call(this, shareSubjectFactory).refCount();
  }
  exports.share = share;
  ;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/single", ["rxjs/Subscriber", "rxjs/util/EmptyError"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var EmptyError_1 = require("rxjs/util/EmptyError");
  function single(predicate) {
    return this.lift(new SingleOperator(predicate, this));
  }
  exports.single = single;
  var SingleOperator = (function() {
    function SingleOperator(predicate, source) {
      this.predicate = predicate;
      this.source = source;
    }
    SingleOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new SingleSubscriber(subscriber, this.predicate, this.source));
    };
    return SingleOperator;
  }());
  var SingleSubscriber = (function(_super) {
    __extends(SingleSubscriber, _super);
    function SingleSubscriber(destination, predicate, source) {
      _super.call(this, destination);
      this.predicate = predicate;
      this.source = source;
      this.seenValue = false;
      this.index = 0;
    }
    SingleSubscriber.prototype.applySingleValue = function(value) {
      if (this.seenValue) {
        this.destination.error('Sequence contains more than one element');
      } else {
        this.seenValue = true;
        this.singleValue = value;
      }
    };
    SingleSubscriber.prototype._next = function(value) {
      var predicate = this.predicate;
      this.index++;
      if (predicate) {
        this.tryNext(value);
      } else {
        this.applySingleValue(value);
      }
    };
    SingleSubscriber.prototype.tryNext = function(value) {
      try {
        var result = this.predicate(value, this.index, this.source);
        if (result) {
          this.applySingleValue(value);
        }
      } catch (err) {
        this.destination.error(err);
      }
    };
    SingleSubscriber.prototype._complete = function() {
      var destination = this.destination;
      if (this.index > 0) {
        destination.next(this.seenValue ? this.singleValue : undefined);
        destination.complete();
      } else {
        destination.error(new EmptyError_1.EmptyError);
      }
    };
    return SingleSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/skip", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function skip(total) {
    return this.lift(new SkipOperator(total));
  }
  exports.skip = skip;
  var SkipOperator = (function() {
    function SkipOperator(total) {
      this.total = total;
    }
    SkipOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new SkipSubscriber(subscriber, this.total));
    };
    return SkipOperator;
  }());
  var SkipSubscriber = (function(_super) {
    __extends(SkipSubscriber, _super);
    function SkipSubscriber(destination, total) {
      _super.call(this, destination);
      this.total = total;
      this.count = 0;
    }
    SkipSubscriber.prototype._next = function(x) {
      if (++this.count > this.total) {
        this.destination.next(x);
      }
    };
    return SkipSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/skipUntil", ["rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function skipUntil(notifier) {
    return this.lift(new SkipUntilOperator(notifier));
  }
  exports.skipUntil = skipUntil;
  var SkipUntilOperator = (function() {
    function SkipUntilOperator(notifier) {
      this.notifier = notifier;
    }
    SkipUntilOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new SkipUntilSubscriber(subscriber, this.notifier));
    };
    return SkipUntilOperator;
  }());
  var SkipUntilSubscriber = (function(_super) {
    __extends(SkipUntilSubscriber, _super);
    function SkipUntilSubscriber(destination, notifier) {
      _super.call(this, destination);
      this.hasValue = false;
      this.isInnerStopped = false;
      this.add(subscribeToResult_1.subscribeToResult(this, notifier));
    }
    SkipUntilSubscriber.prototype._next = function(value) {
      if (this.hasValue) {
        _super.prototype._next.call(this, value);
      }
    };
    SkipUntilSubscriber.prototype._complete = function() {
      if (this.isInnerStopped) {
        _super.prototype._complete.call(this);
      } else {
        this.unsubscribe();
      }
    };
    SkipUntilSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.hasValue = true;
    };
    SkipUntilSubscriber.prototype.notifyComplete = function() {
      this.isInnerStopped = true;
      if (this.isStopped) {
        _super.prototype._complete.call(this);
      }
    };
    return SkipUntilSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/skipWhile", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function skipWhile(predicate) {
    return this.lift(new SkipWhileOperator(predicate));
  }
  exports.skipWhile = skipWhile;
  var SkipWhileOperator = (function() {
    function SkipWhileOperator(predicate) {
      this.predicate = predicate;
    }
    SkipWhileOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new SkipWhileSubscriber(subscriber, this.predicate));
    };
    return SkipWhileOperator;
  }());
  var SkipWhileSubscriber = (function(_super) {
    __extends(SkipWhileSubscriber, _super);
    function SkipWhileSubscriber(destination, predicate) {
      _super.call(this, destination);
      this.predicate = predicate;
      this.skipping = true;
      this.index = 0;
    }
    SkipWhileSubscriber.prototype._next = function(value) {
      var destination = this.destination;
      if (this.skipping) {
        this.tryCallPredicate(value);
      }
      if (!this.skipping) {
        destination.next(value);
      }
    };
    SkipWhileSubscriber.prototype.tryCallPredicate = function(value) {
      try {
        var result = this.predicate(value, this.index++);
        this.skipping = Boolean(result);
      } catch (err) {
        this.destination.error(err);
      }
    };
    return SkipWhileSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/startWith", ["rxjs/observable/ArrayObservable", "rxjs/observable/ScalarObservable", "rxjs/observable/EmptyObservable", "rxjs/operator/concat", "rxjs/util/isScheduler"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var ArrayObservable_1 = require("rxjs/observable/ArrayObservable");
  var ScalarObservable_1 = require("rxjs/observable/ScalarObservable");
  var EmptyObservable_1 = require("rxjs/observable/EmptyObservable");
  var concat_1 = require("rxjs/operator/concat");
  var isScheduler_1 = require("rxjs/util/isScheduler");
  function startWith() {
    var array = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      array[_i - 0] = arguments[_i];
    }
    var scheduler = array[array.length - 1];
    if (isScheduler_1.isScheduler(scheduler)) {
      array.pop();
    } else {
      scheduler = null;
    }
    var len = array.length;
    if (len === 1) {
      return concat_1.concatStatic(new ScalarObservable_1.ScalarObservable(array[0], scheduler), this);
    } else if (len > 1) {
      return concat_1.concatStatic(new ArrayObservable_1.ArrayObservable(array, scheduler), this);
    } else {
      return concat_1.concatStatic(new EmptyObservable_1.EmptyObservable(scheduler), this);
    }
  }
  exports.startWith = startWith;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/Immediate", ["rxjs/util/root"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var root_1 = require("rxjs/util/root");
  var ImmediateDefinition = (function() {
    function ImmediateDefinition(root) {
      this.root = root;
      if (root.setImmediate && typeof root.setImmediate === 'function') {
        this.setImmediate = root.setImmediate.bind(root);
        this.clearImmediate = root.clearImmediate.bind(root);
      } else {
        this.nextHandle = 1;
        this.tasksByHandle = {};
        this.currentlyRunningATask = false;
        if (this.canUseProcessNextTick()) {
          this.setImmediate = this.createProcessNextTickSetImmediate();
        } else if (this.canUsePostMessage()) {
          this.setImmediate = this.createPostMessageSetImmediate();
        } else if (this.canUseMessageChannel()) {
          this.setImmediate = this.createMessageChannelSetImmediate();
        } else if (this.canUseReadyStateChange()) {
          this.setImmediate = this.createReadyStateChangeSetImmediate();
        } else {
          this.setImmediate = this.createSetTimeoutSetImmediate();
        }
        var ci = function clearImmediate(handle) {
          delete clearImmediate.instance.tasksByHandle[handle];
        };
        ci.instance = this;
        this.clearImmediate = ci;
      }
    }
    ImmediateDefinition.prototype.identify = function(o) {
      return this.root.Object.prototype.toString.call(o);
    };
    ImmediateDefinition.prototype.canUseProcessNextTick = function() {
      return this.identify(this.root.process) === '[object process]';
    };
    ImmediateDefinition.prototype.canUseMessageChannel = function() {
      return Boolean(this.root.MessageChannel);
    };
    ImmediateDefinition.prototype.canUseReadyStateChange = function() {
      var document = this.root.document;
      return Boolean(document && 'onreadystatechange' in document.createElement('script'));
    };
    ImmediateDefinition.prototype.canUsePostMessage = function() {
      var root = this.root;
      if (root.postMessage && !root.importScripts) {
        var postMessageIsAsynchronous_1 = true;
        var oldOnMessage = root.onmessage;
        root.onmessage = function() {
          postMessageIsAsynchronous_1 = false;
        };
        root.postMessage('', '*');
        root.onmessage = oldOnMessage;
        return postMessageIsAsynchronous_1;
      }
      return false;
    };
    ImmediateDefinition.prototype.partiallyApplied = function(handler) {
      var args = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
      }
      var fn = function result() {
        var _a = result,
            handler = _a.handler,
            args = _a.args;
        if (typeof handler === 'function') {
          handler.apply(undefined, args);
        } else {
          (new Function('' + handler))();
        }
      };
      fn.handler = handler;
      fn.args = args;
      return fn;
    };
    ImmediateDefinition.prototype.addFromSetImmediateArguments = function(args) {
      this.tasksByHandle[this.nextHandle] = this.partiallyApplied.apply(undefined, args);
      return this.nextHandle++;
    };
    ImmediateDefinition.prototype.createProcessNextTickSetImmediate = function() {
      var fn = function setImmediate() {
        var instance = setImmediate.instance;
        var handle = instance.addFromSetImmediateArguments(arguments);
        instance.root.process.nextTick(instance.partiallyApplied(instance.runIfPresent, handle));
        return handle;
      };
      fn.instance = this;
      return fn;
    };
    ImmediateDefinition.prototype.createPostMessageSetImmediate = function() {
      var root = this.root;
      var messagePrefix = 'setImmediate$' + root.Math.random() + '$';
      var onGlobalMessage = function globalMessageHandler(event) {
        var instance = globalMessageHandler.instance;
        if (event.source === root && typeof event.data === 'string' && event.data.indexOf(messagePrefix) === 0) {
          instance.runIfPresent(+event.data.slice(messagePrefix.length));
        }
      };
      onGlobalMessage.instance = this;
      root.addEventListener('message', onGlobalMessage, false);
      var fn = function setImmediate() {
        var _a = setImmediate,
            messagePrefix = _a.messagePrefix,
            instance = _a.instance;
        var handle = instance.addFromSetImmediateArguments(arguments);
        instance.root.postMessage(messagePrefix + handle, '*');
        return handle;
      };
      fn.instance = this;
      fn.messagePrefix = messagePrefix;
      return fn;
    };
    ImmediateDefinition.prototype.runIfPresent = function(handle) {
      if (this.currentlyRunningATask) {
        this.root.setTimeout(this.partiallyApplied(this.runIfPresent, handle), 0);
      } else {
        var task = this.tasksByHandle[handle];
        if (task) {
          this.currentlyRunningATask = true;
          try {
            task();
          } finally {
            this.clearImmediate(handle);
            this.currentlyRunningATask = false;
          }
        }
      }
    };
    ImmediateDefinition.prototype.createMessageChannelSetImmediate = function() {
      var _this = this;
      var channel = new this.root.MessageChannel();
      channel.port1.onmessage = function(event) {
        var handle = event.data;
        _this.runIfPresent(handle);
      };
      var fn = function setImmediate() {
        var _a = setImmediate,
            channel = _a.channel,
            instance = _a.instance;
        var handle = instance.addFromSetImmediateArguments(arguments);
        channel.port2.postMessage(handle);
        return handle;
      };
      fn.channel = channel;
      fn.instance = this;
      return fn;
    };
    ImmediateDefinition.prototype.createReadyStateChangeSetImmediate = function() {
      var fn = function setImmediate() {
        var instance = setImmediate.instance;
        var root = instance.root;
        var doc = root.document;
        var html = doc.documentElement;
        var handle = instance.addFromSetImmediateArguments(arguments);
        var script = doc.createElement('script');
        script.onreadystatechange = function() {
          instance.runIfPresent(handle);
          script.onreadystatechange = null;
          html.removeChild(script);
          script = null;
        };
        html.appendChild(script);
        return handle;
      };
      fn.instance = this;
      return fn;
    };
    ImmediateDefinition.prototype.createSetTimeoutSetImmediate = function() {
      var fn = function setImmediate() {
        var instance = setImmediate.instance;
        var handle = instance.addFromSetImmediateArguments(arguments);
        instance.root.setTimeout(instance.partiallyApplied(instance.runIfPresent, handle), 0);
        return handle;
      };
      fn.instance = this;
      return fn;
    };
    return ImmediateDefinition;
  }());
  exports.ImmediateDefinition = ImmediateDefinition;
  exports.Immediate = new ImmediateDefinition(root_1.root);
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/switch", ["rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function _switch() {
    return this.lift(new SwitchOperator());
  }
  exports._switch = _switch;
  var SwitchOperator = (function() {
    function SwitchOperator() {}
    SwitchOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new SwitchSubscriber(subscriber));
    };
    return SwitchOperator;
  }());
  var SwitchSubscriber = (function(_super) {
    __extends(SwitchSubscriber, _super);
    function SwitchSubscriber(destination) {
      _super.call(this, destination);
      this.active = 0;
      this.hasCompleted = false;
    }
    SwitchSubscriber.prototype._next = function(value) {
      this.unsubscribeInner();
      this.active++;
      this.add(this.innerSubscription = subscribeToResult_1.subscribeToResult(this, value));
    };
    SwitchSubscriber.prototype._complete = function() {
      this.hasCompleted = true;
      if (this.active === 0) {
        this.destination.complete();
      }
    };
    SwitchSubscriber.prototype.unsubscribeInner = function() {
      this.active = this.active > 0 ? this.active - 1 : 0;
      var innerSubscription = this.innerSubscription;
      if (innerSubscription) {
        innerSubscription.unsubscribe();
        this.remove(innerSubscription);
      }
    };
    SwitchSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.destination.next(innerValue);
    };
    SwitchSubscriber.prototype.notifyError = function(err) {
      this.destination.error(err);
    };
    SwitchSubscriber.prototype.notifyComplete = function() {
      this.unsubscribeInner();
      if (this.hasCompleted && this.active === 0) {
        this.destination.complete();
      }
    };
    return SwitchSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/switchMap", ["rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function switchMap(project, resultSelector) {
    return this.lift(new SwitchMapOperator(project, resultSelector));
  }
  exports.switchMap = switchMap;
  var SwitchMapOperator = (function() {
    function SwitchMapOperator(project, resultSelector) {
      this.project = project;
      this.resultSelector = resultSelector;
    }
    SwitchMapOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new SwitchMapSubscriber(subscriber, this.project, this.resultSelector));
    };
    return SwitchMapOperator;
  }());
  var SwitchMapSubscriber = (function(_super) {
    __extends(SwitchMapSubscriber, _super);
    function SwitchMapSubscriber(destination, project, resultSelector) {
      _super.call(this, destination);
      this.project = project;
      this.resultSelector = resultSelector;
      this.index = 0;
    }
    SwitchMapSubscriber.prototype._next = function(value) {
      var result;
      var index = this.index++;
      try {
        result = this.project(value, index);
      } catch (error) {
        this.destination.error(error);
        return ;
      }
      this._innerSub(result, value, index);
    };
    SwitchMapSubscriber.prototype._innerSub = function(result, value, index) {
      var innerSubscription = this.innerSubscription;
      if (innerSubscription) {
        innerSubscription.unsubscribe();
      }
      this.add(this.innerSubscription = subscribeToResult_1.subscribeToResult(this, result, value, index));
    };
    SwitchMapSubscriber.prototype._complete = function() {
      var innerSubscription = this.innerSubscription;
      if (!innerSubscription || innerSubscription.isUnsubscribed) {
        _super.prototype._complete.call(this);
      }
    };
    SwitchMapSubscriber.prototype._unsubscribe = function() {
      this.innerSubscription = null;
    };
    SwitchMapSubscriber.prototype.notifyComplete = function(innerSub) {
      this.remove(innerSub);
      this.innerSubscription = null;
      if (this.isStopped) {
        _super.prototype._complete.call(this);
      }
    };
    SwitchMapSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      if (this.resultSelector) {
        this._tryNotifyNext(outerValue, innerValue, outerIndex, innerIndex);
      } else {
        this.destination.next(innerValue);
      }
    };
    SwitchMapSubscriber.prototype._tryNotifyNext = function(outerValue, innerValue, outerIndex, innerIndex) {
      var result;
      try {
        result = this.resultSelector(outerValue, innerValue, outerIndex, innerIndex);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      this.destination.next(result);
    };
    return SwitchMapSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/switchMapTo", ["rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function switchMapTo(innerObservable, resultSelector) {
    return this.lift(new SwitchMapToOperator(innerObservable, resultSelector));
  }
  exports.switchMapTo = switchMapTo;
  var SwitchMapToOperator = (function() {
    function SwitchMapToOperator(observable, resultSelector) {
      this.observable = observable;
      this.resultSelector = resultSelector;
    }
    SwitchMapToOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new SwitchMapToSubscriber(subscriber, this.observable, this.resultSelector));
    };
    return SwitchMapToOperator;
  }());
  var SwitchMapToSubscriber = (function(_super) {
    __extends(SwitchMapToSubscriber, _super);
    function SwitchMapToSubscriber(destination, inner, resultSelector) {
      _super.call(this, destination);
      this.inner = inner;
      this.resultSelector = resultSelector;
      this.index = 0;
    }
    SwitchMapToSubscriber.prototype._next = function(value) {
      var innerSubscription = this.innerSubscription;
      if (innerSubscription) {
        innerSubscription.unsubscribe();
      }
      this.add(this.innerSubscription = subscribeToResult_1.subscribeToResult(this, this.inner, value, this.index++));
    };
    SwitchMapToSubscriber.prototype._complete = function() {
      var innerSubscription = this.innerSubscription;
      if (!innerSubscription || innerSubscription.isUnsubscribed) {
        _super.prototype._complete.call(this);
      }
    };
    SwitchMapToSubscriber.prototype._unsubscribe = function() {
      this.innerSubscription = null;
    };
    SwitchMapToSubscriber.prototype.notifyComplete = function(innerSub) {
      this.remove(innerSub);
      this.innerSubscription = null;
      if (this.isStopped) {
        _super.prototype._complete.call(this);
      }
    };
    SwitchMapToSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      var _a = this,
          resultSelector = _a.resultSelector,
          destination = _a.destination;
      if (resultSelector) {
        this.tryResultSelector(outerValue, innerValue, outerIndex, innerIndex);
      } else {
        destination.next(innerValue);
      }
    };
    SwitchMapToSubscriber.prototype.tryResultSelector = function(outerValue, innerValue, outerIndex, innerIndex) {
      var _a = this,
          resultSelector = _a.resultSelector,
          destination = _a.destination;
      var result;
      try {
        result = resultSelector(outerValue, innerValue, outerIndex, innerIndex);
      } catch (err) {
        destination.error(err);
        return ;
      }
      destination.next(result);
    };
    return SwitchMapToSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/ArgumentOutOfRangeError", [], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var ArgumentOutOfRangeError = (function(_super) {
    __extends(ArgumentOutOfRangeError, _super);
    function ArgumentOutOfRangeError() {
      _super.call(this, 'argument out of range');
      this.name = 'ArgumentOutOfRangeError';
    }
    return ArgumentOutOfRangeError;
  }(Error));
  exports.ArgumentOutOfRangeError = ArgumentOutOfRangeError;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/takeLast", ["rxjs/Subscriber", "rxjs/util/ArgumentOutOfRangeError", "rxjs/observable/EmptyObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var ArgumentOutOfRangeError_1 = require("rxjs/util/ArgumentOutOfRangeError");
  var EmptyObservable_1 = require("rxjs/observable/EmptyObservable");
  function takeLast(total) {
    if (total === 0) {
      return new EmptyObservable_1.EmptyObservable();
    } else {
      return this.lift(new TakeLastOperator(total));
    }
  }
  exports.takeLast = takeLast;
  var TakeLastOperator = (function() {
    function TakeLastOperator(total) {
      this.total = total;
      if (this.total < 0) {
        throw new ArgumentOutOfRangeError_1.ArgumentOutOfRangeError;
      }
    }
    TakeLastOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new TakeLastSubscriber(subscriber, this.total));
    };
    return TakeLastOperator;
  }());
  var TakeLastSubscriber = (function(_super) {
    __extends(TakeLastSubscriber, _super);
    function TakeLastSubscriber(destination, total) {
      _super.call(this, destination);
      this.total = total;
      this.ring = new Array();
      this.count = 0;
    }
    TakeLastSubscriber.prototype._next = function(value) {
      var ring = this.ring;
      var total = this.total;
      var count = this.count++;
      if (ring.length < total) {
        ring.push(value);
      } else {
        var index = count % total;
        ring[index] = value;
      }
    };
    TakeLastSubscriber.prototype._complete = function() {
      var destination = this.destination;
      var count = this.count;
      if (count > 0) {
        var total = this.count >= this.total ? this.total : this.count;
        var ring = this.ring;
        for (var i = 0; i < total; i++) {
          var idx = (count++) % total;
          destination.next(ring[idx]);
        }
      }
      destination.complete();
    };
    return TakeLastSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/takeUntil", ["rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function takeUntil(notifier) {
    return this.lift(new TakeUntilOperator(notifier));
  }
  exports.takeUntil = takeUntil;
  var TakeUntilOperator = (function() {
    function TakeUntilOperator(notifier) {
      this.notifier = notifier;
    }
    TakeUntilOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new TakeUntilSubscriber(subscriber, this.notifier));
    };
    return TakeUntilOperator;
  }());
  var TakeUntilSubscriber = (function(_super) {
    __extends(TakeUntilSubscriber, _super);
    function TakeUntilSubscriber(destination, notifier) {
      _super.call(this, destination);
      this.notifier = notifier;
      this.add(subscribeToResult_1.subscribeToResult(this, notifier));
    }
    TakeUntilSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.complete();
    };
    TakeUntilSubscriber.prototype.notifyComplete = function() {};
    return TakeUntilSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/takeWhile", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function takeWhile(predicate) {
    return this.lift(new TakeWhileOperator(predicate));
  }
  exports.takeWhile = takeWhile;
  var TakeWhileOperator = (function() {
    function TakeWhileOperator(predicate) {
      this.predicate = predicate;
    }
    TakeWhileOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new TakeWhileSubscriber(subscriber, this.predicate));
    };
    return TakeWhileOperator;
  }());
  var TakeWhileSubscriber = (function(_super) {
    __extends(TakeWhileSubscriber, _super);
    function TakeWhileSubscriber(destination, predicate) {
      _super.call(this, destination);
      this.predicate = predicate;
      this.index = 0;
    }
    TakeWhileSubscriber.prototype._next = function(value) {
      var destination = this.destination;
      var result;
      try {
        result = this.predicate(value, this.index++);
      } catch (err) {
        destination.error(err);
        return ;
      }
      this.nextOrComplete(value, result);
    };
    TakeWhileSubscriber.prototype.nextOrComplete = function(value, predicateResult) {
      var destination = this.destination;
      if (Boolean(predicateResult)) {
        destination.next(value);
      } else {
        destination.complete();
      }
    };
    return TakeWhileSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/throttle", ["rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function throttle(durationSelector) {
    return this.lift(new ThrottleOperator(durationSelector));
  }
  exports.throttle = throttle;
  var ThrottleOperator = (function() {
    function ThrottleOperator(durationSelector) {
      this.durationSelector = durationSelector;
    }
    ThrottleOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new ThrottleSubscriber(subscriber, this.durationSelector));
    };
    return ThrottleOperator;
  }());
  var ThrottleSubscriber = (function(_super) {
    __extends(ThrottleSubscriber, _super);
    function ThrottleSubscriber(destination, durationSelector) {
      _super.call(this, destination);
      this.destination = destination;
      this.durationSelector = durationSelector;
    }
    ThrottleSubscriber.prototype._next = function(value) {
      if (!this.throttled) {
        this.tryDurationSelector(value);
      }
    };
    ThrottleSubscriber.prototype.tryDurationSelector = function(value) {
      var duration = null;
      try {
        duration = this.durationSelector(value);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      this.emitAndThrottle(value, duration);
    };
    ThrottleSubscriber.prototype.emitAndThrottle = function(value, duration) {
      this.add(this.throttled = subscribeToResult_1.subscribeToResult(this, duration));
      this.destination.next(value);
    };
    ThrottleSubscriber.prototype._unsubscribe = function() {
      var throttled = this.throttled;
      if (throttled) {
        this.remove(throttled);
        this.throttled = null;
        throttled.unsubscribe();
      }
    };
    ThrottleSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this._unsubscribe();
    };
    ThrottleSubscriber.prototype.notifyComplete = function() {
      this._unsubscribe();
    };
    return ThrottleSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/throttleTime", ["rxjs/Subscriber", "rxjs/scheduler/async"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var async_1 = require("rxjs/scheduler/async");
  function throttleTime(delay, scheduler) {
    if (scheduler === void 0) {
      scheduler = async_1.async;
    }
    return this.lift(new ThrottleTimeOperator(delay, scheduler));
  }
  exports.throttleTime = throttleTime;
  var ThrottleTimeOperator = (function() {
    function ThrottleTimeOperator(delay, scheduler) {
      this.delay = delay;
      this.scheduler = scheduler;
    }
    ThrottleTimeOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new ThrottleTimeSubscriber(subscriber, this.delay, this.scheduler));
    };
    return ThrottleTimeOperator;
  }());
  var ThrottleTimeSubscriber = (function(_super) {
    __extends(ThrottleTimeSubscriber, _super);
    function ThrottleTimeSubscriber(destination, delay, scheduler) {
      _super.call(this, destination);
      this.delay = delay;
      this.scheduler = scheduler;
    }
    ThrottleTimeSubscriber.prototype._next = function(value) {
      if (!this.throttled) {
        this.add(this.throttled = this.scheduler.schedule(dispatchNext, this.delay, {subscriber: this}));
        this.destination.next(value);
      }
    };
    ThrottleTimeSubscriber.prototype.clearThrottle = function() {
      var throttled = this.throttled;
      if (throttled) {
        throttled.unsubscribe();
        this.remove(throttled);
        this.throttled = null;
      }
    };
    return ThrottleTimeSubscriber;
  }(Subscriber_1.Subscriber));
  function dispatchNext(arg) {
    var subscriber = arg.subscriber;
    subscriber.clearThrottle();
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/timeout", ["rxjs/scheduler/async", "rxjs/util/isDate", "rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var async_1 = require("rxjs/scheduler/async");
  var isDate_1 = require("rxjs/util/isDate");
  var Subscriber_1 = require("rxjs/Subscriber");
  function timeout(due, errorToSend, scheduler) {
    if (errorToSend === void 0) {
      errorToSend = null;
    }
    if (scheduler === void 0) {
      scheduler = async_1.async;
    }
    var absoluteTimeout = isDate_1.isDate(due);
    var waitFor = absoluteTimeout ? (+due - scheduler.now()) : Math.abs(due);
    return this.lift(new TimeoutOperator(waitFor, absoluteTimeout, errorToSend, scheduler));
  }
  exports.timeout = timeout;
  var TimeoutOperator = (function() {
    function TimeoutOperator(waitFor, absoluteTimeout, errorToSend, scheduler) {
      this.waitFor = waitFor;
      this.absoluteTimeout = absoluteTimeout;
      this.errorToSend = errorToSend;
      this.scheduler = scheduler;
    }
    TimeoutOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new TimeoutSubscriber(subscriber, this.absoluteTimeout, this.waitFor, this.errorToSend, this.scheduler));
    };
    return TimeoutOperator;
  }());
  var TimeoutSubscriber = (function(_super) {
    __extends(TimeoutSubscriber, _super);
    function TimeoutSubscriber(destination, absoluteTimeout, waitFor, errorToSend, scheduler) {
      _super.call(this, destination);
      this.absoluteTimeout = absoluteTimeout;
      this.waitFor = waitFor;
      this.errorToSend = errorToSend;
      this.scheduler = scheduler;
      this.index = 0;
      this._previousIndex = 0;
      this._hasCompleted = false;
      this.scheduleTimeout();
    }
    Object.defineProperty(TimeoutSubscriber.prototype, "previousIndex", {
      get: function() {
        return this._previousIndex;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(TimeoutSubscriber.prototype, "hasCompleted", {
      get: function() {
        return this._hasCompleted;
      },
      enumerable: true,
      configurable: true
    });
    TimeoutSubscriber.dispatchTimeout = function(state) {
      var source = state.subscriber;
      var currentIndex = state.index;
      if (!source.hasCompleted && source.previousIndex === currentIndex) {
        source.notifyTimeout();
      }
    };
    TimeoutSubscriber.prototype.scheduleTimeout = function() {
      var currentIndex = this.index;
      this.scheduler.schedule(TimeoutSubscriber.dispatchTimeout, this.waitFor, {
        subscriber: this,
        index: currentIndex
      });
      this.index++;
      this._previousIndex = currentIndex;
    };
    TimeoutSubscriber.prototype._next = function(value) {
      this.destination.next(value);
      if (!this.absoluteTimeout) {
        this.scheduleTimeout();
      }
    };
    TimeoutSubscriber.prototype._error = function(err) {
      this.destination.error(err);
      this._hasCompleted = true;
    };
    TimeoutSubscriber.prototype._complete = function() {
      this.destination.complete();
      this._hasCompleted = true;
    };
    TimeoutSubscriber.prototype.notifyTimeout = function() {
      this.error(this.errorToSend || new Error('timeout'));
    };
    return TimeoutSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/timeoutWith", ["rxjs/scheduler/async", "rxjs/util/isDate", "rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var async_1 = require("rxjs/scheduler/async");
  var isDate_1 = require("rxjs/util/isDate");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function timeoutWith(due, withObservable, scheduler) {
    if (scheduler === void 0) {
      scheduler = async_1.async;
    }
    var absoluteTimeout = isDate_1.isDate(due);
    var waitFor = absoluteTimeout ? (+due - scheduler.now()) : Math.abs(due);
    return this.lift(new TimeoutWithOperator(waitFor, absoluteTimeout, withObservable, scheduler));
  }
  exports.timeoutWith = timeoutWith;
  var TimeoutWithOperator = (function() {
    function TimeoutWithOperator(waitFor, absoluteTimeout, withObservable, scheduler) {
      this.waitFor = waitFor;
      this.absoluteTimeout = absoluteTimeout;
      this.withObservable = withObservable;
      this.scheduler = scheduler;
    }
    TimeoutWithOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new TimeoutWithSubscriber(subscriber, this.absoluteTimeout, this.waitFor, this.withObservable, this.scheduler));
    };
    return TimeoutWithOperator;
  }());
  var TimeoutWithSubscriber = (function(_super) {
    __extends(TimeoutWithSubscriber, _super);
    function TimeoutWithSubscriber(destination, absoluteTimeout, waitFor, withObservable, scheduler) {
      _super.call(this);
      this.destination = destination;
      this.absoluteTimeout = absoluteTimeout;
      this.waitFor = waitFor;
      this.withObservable = withObservable;
      this.scheduler = scheduler;
      this.timeoutSubscription = undefined;
      this.index = 0;
      this._previousIndex = 0;
      this._hasCompleted = false;
      destination.add(this);
      this.scheduleTimeout();
    }
    Object.defineProperty(TimeoutWithSubscriber.prototype, "previousIndex", {
      get: function() {
        return this._previousIndex;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(TimeoutWithSubscriber.prototype, "hasCompleted", {
      get: function() {
        return this._hasCompleted;
      },
      enumerable: true,
      configurable: true
    });
    TimeoutWithSubscriber.dispatchTimeout = function(state) {
      var source = state.subscriber;
      var currentIndex = state.index;
      if (!source.hasCompleted && source.previousIndex === currentIndex) {
        source.handleTimeout();
      }
    };
    TimeoutWithSubscriber.prototype.scheduleTimeout = function() {
      var currentIndex = this.index;
      var timeoutState = {
        subscriber: this,
        index: currentIndex
      };
      this.scheduler.schedule(TimeoutWithSubscriber.dispatchTimeout, this.waitFor, timeoutState);
      this.index++;
      this._previousIndex = currentIndex;
    };
    TimeoutWithSubscriber.prototype._next = function(value) {
      this.destination.next(value);
      if (!this.absoluteTimeout) {
        this.scheduleTimeout();
      }
    };
    TimeoutWithSubscriber.prototype._error = function(err) {
      this.destination.error(err);
      this._hasCompleted = true;
    };
    TimeoutWithSubscriber.prototype._complete = function() {
      this.destination.complete();
      this._hasCompleted = true;
    };
    TimeoutWithSubscriber.prototype.handleTimeout = function() {
      if (!this.isUnsubscribed) {
        var withObservable = this.withObservable;
        this.unsubscribe();
        this.destination.add(this.timeoutSubscription = subscribeToResult_1.subscribeToResult(this, withObservable));
      }
    };
    return TimeoutWithSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/toArray", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  function toArray() {
    return this.lift(new ToArrayOperator());
  }
  exports.toArray = toArray;
  var ToArrayOperator = (function() {
    function ToArrayOperator() {}
    ToArrayOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new ToArraySubscriber(subscriber));
    };
    return ToArrayOperator;
  }());
  var ToArraySubscriber = (function(_super) {
    __extends(ToArraySubscriber, _super);
    function ToArraySubscriber(destination) {
      _super.call(this, destination);
      this.array = [];
    }
    ToArraySubscriber.prototype._next = function(x) {
      this.array.push(x);
    };
    ToArraySubscriber.prototype._complete = function() {
      this.destination.next(this.array);
      this.destination.complete();
    };
    return ToArraySubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/toPromise", ["rxjs/util/root"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var root_1 = require("rxjs/util/root");
  function toPromise(PromiseCtor) {
    var _this = this;
    if (!PromiseCtor) {
      if (root_1.root.Rx && root_1.root.Rx.config && root_1.root.Rx.config.Promise) {
        PromiseCtor = root_1.root.Rx.config.Promise;
      } else if (root_1.root.Promise) {
        PromiseCtor = root_1.root.Promise;
      }
    }
    if (!PromiseCtor) {
      throw new Error('no Promise impl found');
    }
    return new PromiseCtor(function(resolve, reject) {
      var value;
      _this.subscribe(function(x) {
        return value = x;
      }, function(err) {
        return reject(err);
      }, function() {
        return resolve(value);
      });
    });
  }
  exports.toPromise = toPromise;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/window", ["rxjs/Subject", "rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subject_1 = require("rxjs/Subject");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function window(windowBoundaries) {
    return this.lift(new WindowOperator(windowBoundaries));
  }
  exports.window = window;
  var WindowOperator = (function() {
    function WindowOperator(windowBoundaries) {
      this.windowBoundaries = windowBoundaries;
    }
    WindowOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new WindowSubscriber(subscriber, this.windowBoundaries));
    };
    return WindowOperator;
  }());
  var WindowSubscriber = (function(_super) {
    __extends(WindowSubscriber, _super);
    function WindowSubscriber(destination, windowBoundaries) {
      _super.call(this, destination);
      this.destination = destination;
      this.windowBoundaries = windowBoundaries;
      this.add(subscribeToResult_1.subscribeToResult(this, windowBoundaries));
      this.openWindow();
    }
    WindowSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.openWindow();
    };
    WindowSubscriber.prototype.notifyError = function(error, innerSub) {
      this._error(error);
    };
    WindowSubscriber.prototype.notifyComplete = function(innerSub) {
      this._complete();
    };
    WindowSubscriber.prototype._next = function(value) {
      this.window.next(value);
    };
    WindowSubscriber.prototype._error = function(err) {
      this.window.error(err);
      this.destination.error(err);
    };
    WindowSubscriber.prototype._complete = function() {
      this.window.complete();
      this.destination.complete();
    };
    WindowSubscriber.prototype.openWindow = function() {
      var prevWindow = this.window;
      if (prevWindow) {
        prevWindow.complete();
      }
      var destination = this.destination;
      var newWindow = this.window = new Subject_1.Subject();
      destination.add(newWindow);
      destination.next(newWindow);
    };
    return WindowSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/windowCount", ["rxjs/Subscriber", "rxjs/Subject"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var Subject_1 = require("rxjs/Subject");
  function windowCount(windowSize, startWindowEvery) {
    if (startWindowEvery === void 0) {
      startWindowEvery = 0;
    }
    return this.lift(new WindowCountOperator(windowSize, startWindowEvery));
  }
  exports.windowCount = windowCount;
  var WindowCountOperator = (function() {
    function WindowCountOperator(windowSize, startWindowEvery) {
      this.windowSize = windowSize;
      this.startWindowEvery = startWindowEvery;
    }
    WindowCountOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new WindowCountSubscriber(subscriber, this.windowSize, this.startWindowEvery));
    };
    return WindowCountOperator;
  }());
  var WindowCountSubscriber = (function(_super) {
    __extends(WindowCountSubscriber, _super);
    function WindowCountSubscriber(destination, windowSize, startWindowEvery) {
      _super.call(this, destination);
      this.destination = destination;
      this.windowSize = windowSize;
      this.startWindowEvery = startWindowEvery;
      this.windows = [new Subject_1.Subject()];
      this.count = 0;
      var firstWindow = this.windows[0];
      destination.add(firstWindow);
      destination.next(firstWindow);
    }
    WindowCountSubscriber.prototype._next = function(value) {
      var startWindowEvery = (this.startWindowEvery > 0) ? this.startWindowEvery : this.windowSize;
      var destination = this.destination;
      var windowSize = this.windowSize;
      var windows = this.windows;
      var len = windows.length;
      for (var i = 0; i < len; i++) {
        windows[i].next(value);
      }
      var c = this.count - windowSize + 1;
      if (c >= 0 && c % startWindowEvery === 0) {
        windows.shift().complete();
      }
      if (++this.count % startWindowEvery === 0) {
        var window_1 = new Subject_1.Subject();
        windows.push(window_1);
        destination.add(window_1);
        destination.next(window_1);
      }
    };
    WindowCountSubscriber.prototype._error = function(err) {
      var windows = this.windows;
      while (windows.length > 0) {
        windows.shift().error(err);
      }
      this.destination.error(err);
    };
    WindowCountSubscriber.prototype._complete = function() {
      var windows = this.windows;
      while (windows.length > 0) {
        windows.shift().complete();
      }
      this.destination.complete();
    };
    return WindowCountSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/windowTime", ["rxjs/Subscriber", "rxjs/Subject", "rxjs/scheduler/async"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var Subject_1 = require("rxjs/Subject");
  var async_1 = require("rxjs/scheduler/async");
  function windowTime(windowTimeSpan, windowCreationInterval, scheduler) {
    if (windowCreationInterval === void 0) {
      windowCreationInterval = null;
    }
    if (scheduler === void 0) {
      scheduler = async_1.async;
    }
    return this.lift(new WindowTimeOperator(windowTimeSpan, windowCreationInterval, scheduler));
  }
  exports.windowTime = windowTime;
  var WindowTimeOperator = (function() {
    function WindowTimeOperator(windowTimeSpan, windowCreationInterval, scheduler) {
      this.windowTimeSpan = windowTimeSpan;
      this.windowCreationInterval = windowCreationInterval;
      this.scheduler = scheduler;
    }
    WindowTimeOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new WindowTimeSubscriber(subscriber, this.windowTimeSpan, this.windowCreationInterval, this.scheduler));
    };
    return WindowTimeOperator;
  }());
  var WindowTimeSubscriber = (function(_super) {
    __extends(WindowTimeSubscriber, _super);
    function WindowTimeSubscriber(destination, windowTimeSpan, windowCreationInterval, scheduler) {
      _super.call(this, destination);
      this.destination = destination;
      this.windowTimeSpan = windowTimeSpan;
      this.windowCreationInterval = windowCreationInterval;
      this.scheduler = scheduler;
      this.windows = [];
      if (windowCreationInterval !== null && windowCreationInterval >= 0) {
        var window_1 = this.openWindow();
        var closeState = {
          subscriber: this,
          window: window_1,
          context: null
        };
        var creationState = {
          windowTimeSpan: windowTimeSpan,
          windowCreationInterval: windowCreationInterval,
          subscriber: this,
          scheduler: scheduler
        };
        this.add(scheduler.schedule(dispatchWindowClose, windowTimeSpan, closeState));
        this.add(scheduler.schedule(dispatchWindowCreation, windowCreationInterval, creationState));
      } else {
        var window_2 = this.openWindow();
        var timeSpanOnlyState = {
          subscriber: this,
          window: window_2,
          windowTimeSpan: windowTimeSpan
        };
        this.add(scheduler.schedule(dispatchWindowTimeSpanOnly, windowTimeSpan, timeSpanOnlyState));
      }
    }
    WindowTimeSubscriber.prototype._next = function(value) {
      var windows = this.windows;
      var len = windows.length;
      for (var i = 0; i < len; i++) {
        var window_3 = windows[i];
        if (!window_3.isUnsubscribed) {
          window_3.next(value);
        }
      }
    };
    WindowTimeSubscriber.prototype._error = function(err) {
      var windows = this.windows;
      while (windows.length > 0) {
        windows.shift().error(err);
      }
      this.destination.error(err);
    };
    WindowTimeSubscriber.prototype._complete = function() {
      var windows = this.windows;
      while (windows.length > 0) {
        var window_4 = windows.shift();
        if (!window_4.isUnsubscribed) {
          window_4.complete();
        }
      }
      this.destination.complete();
    };
    WindowTimeSubscriber.prototype.openWindow = function() {
      var window = new Subject_1.Subject();
      this.windows.push(window);
      var destination = this.destination;
      destination.add(window);
      destination.next(window);
      return window;
    };
    WindowTimeSubscriber.prototype.closeWindow = function(window) {
      window.complete();
      var windows = this.windows;
      windows.splice(windows.indexOf(window), 1);
    };
    return WindowTimeSubscriber;
  }(Subscriber_1.Subscriber));
  function dispatchWindowTimeSpanOnly(state) {
    var subscriber = state.subscriber,
        windowTimeSpan = state.windowTimeSpan,
        window = state.window;
    if (window) {
      window.complete();
    }
    state.window = subscriber.openWindow();
    this.schedule(state, windowTimeSpan);
  }
  function dispatchWindowCreation(state) {
    var windowTimeSpan = state.windowTimeSpan,
        subscriber = state.subscriber,
        scheduler = state.scheduler,
        windowCreationInterval = state.windowCreationInterval;
    var window = subscriber.openWindow();
    var action = this;
    var context = {
      action: action,
      subscription: null
    };
    var timeSpanState = {
      subscriber: subscriber,
      window: window,
      context: context
    };
    context.subscription = scheduler.schedule(dispatchWindowClose, windowTimeSpan, timeSpanState);
    action.add(context.subscription);
    action.schedule(state, windowCreationInterval);
  }
  function dispatchWindowClose(arg) {
    var subscriber = arg.subscriber,
        window = arg.window,
        context = arg.context;
    if (context && context.action && context.subscription) {
      context.action.remove(context.subscription);
    }
    subscriber.closeWindow(window);
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/windowToggle", ["rxjs/Subject", "rxjs/Subscription", "rxjs/util/tryCatch", "rxjs/util/errorObject", "rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subject_1 = require("rxjs/Subject");
  var Subscription_1 = require("rxjs/Subscription");
  var tryCatch_1 = require("rxjs/util/tryCatch");
  var errorObject_1 = require("rxjs/util/errorObject");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function windowToggle(openings, closingSelector) {
    return this.lift(new WindowToggleOperator(openings, closingSelector));
  }
  exports.windowToggle = windowToggle;
  var WindowToggleOperator = (function() {
    function WindowToggleOperator(openings, closingSelector) {
      this.openings = openings;
      this.closingSelector = closingSelector;
    }
    WindowToggleOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new WindowToggleSubscriber(subscriber, this.openings, this.closingSelector));
    };
    return WindowToggleOperator;
  }());
  var WindowToggleSubscriber = (function(_super) {
    __extends(WindowToggleSubscriber, _super);
    function WindowToggleSubscriber(destination, openings, closingSelector) {
      _super.call(this, destination);
      this.openings = openings;
      this.closingSelector = closingSelector;
      this.contexts = [];
      this.add(this.openSubscription = subscribeToResult_1.subscribeToResult(this, openings, openings));
    }
    WindowToggleSubscriber.prototype._next = function(value) {
      var contexts = this.contexts;
      if (contexts) {
        var len = contexts.length;
        for (var i = 0; i < len; i++) {
          contexts[i].window.next(value);
        }
      }
    };
    WindowToggleSubscriber.prototype._error = function(err) {
      var contexts = this.contexts;
      this.contexts = null;
      if (contexts) {
        var len = contexts.length;
        var index = -1;
        while (++index < len) {
          var context = contexts[index];
          context.window.error(err);
          context.subscription.unsubscribe();
        }
      }
      _super.prototype._error.call(this, err);
    };
    WindowToggleSubscriber.prototype._complete = function() {
      var contexts = this.contexts;
      this.contexts = null;
      if (contexts) {
        var len = contexts.length;
        var index = -1;
        while (++index < len) {
          var context = contexts[index];
          context.window.complete();
          context.subscription.unsubscribe();
        }
      }
      _super.prototype._complete.call(this);
    };
    WindowToggleSubscriber.prototype._unsubscribe = function() {
      var contexts = this.contexts;
      this.contexts = null;
      if (contexts) {
        var len = contexts.length;
        var index = -1;
        while (++index < len) {
          var context = contexts[index];
          context.window.unsubscribe();
          context.subscription.unsubscribe();
        }
      }
    };
    WindowToggleSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      if (outerValue === this.openings) {
        var closingSelector = this.closingSelector;
        var closingNotifier = tryCatch_1.tryCatch(closingSelector)(innerValue);
        if (closingNotifier === errorObject_1.errorObject) {
          return this.error(errorObject_1.errorObject.e);
        } else {
          var window_1 = new Subject_1.Subject();
          var subscription = new Subscription_1.Subscription();
          var context = {
            window: window_1,
            subscription: subscription
          };
          this.contexts.push(context);
          var innerSubscription = subscribeToResult_1.subscribeToResult(this, closingNotifier, context);
          if (innerSubscription.isUnsubscribed) {
            this.closeWindow(this.contexts.length - 1);
          } else {
            innerSubscription.context = context;
            subscription.add(innerSubscription);
          }
          this.destination.next(window_1);
        }
      } else {
        this.closeWindow(this.contexts.indexOf(outerValue));
      }
    };
    WindowToggleSubscriber.prototype.notifyError = function(err) {
      this.error(err);
    };
    WindowToggleSubscriber.prototype.notifyComplete = function(inner) {
      if (inner !== this.openSubscription) {
        this.closeWindow(this.contexts.indexOf(inner.context));
      }
    };
    WindowToggleSubscriber.prototype.closeWindow = function(index) {
      if (index === -1) {
        return ;
      }
      var contexts = this.contexts;
      var context = contexts[index];
      var window = context.window,
          subscription = context.subscription;
      contexts.splice(index, 1);
      window.complete();
      subscription.unsubscribe();
    };
    return WindowToggleSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/windowWhen", ["rxjs/Subject", "rxjs/util/tryCatch", "rxjs/util/errorObject", "rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subject_1 = require("rxjs/Subject");
  var tryCatch_1 = require("rxjs/util/tryCatch");
  var errorObject_1 = require("rxjs/util/errorObject");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function windowWhen(closingSelector) {
    return this.lift(new WindowOperator(closingSelector));
  }
  exports.windowWhen = windowWhen;
  var WindowOperator = (function() {
    function WindowOperator(closingSelector) {
      this.closingSelector = closingSelector;
    }
    WindowOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new WindowSubscriber(subscriber, this.closingSelector));
    };
    return WindowOperator;
  }());
  var WindowSubscriber = (function(_super) {
    __extends(WindowSubscriber, _super);
    function WindowSubscriber(destination, closingSelector) {
      _super.call(this, destination);
      this.destination = destination;
      this.closingSelector = closingSelector;
      this.openWindow();
    }
    WindowSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.openWindow(innerSub);
    };
    WindowSubscriber.prototype.notifyError = function(error, innerSub) {
      this._error(error);
    };
    WindowSubscriber.prototype.notifyComplete = function(innerSub) {
      this.openWindow(innerSub);
    };
    WindowSubscriber.prototype._next = function(value) {
      this.window.next(value);
    };
    WindowSubscriber.prototype._error = function(err) {
      this.window.error(err);
      this.destination.error(err);
      this.unsubscribeClosingNotification();
    };
    WindowSubscriber.prototype._complete = function() {
      this.window.complete();
      this.destination.complete();
      this.unsubscribeClosingNotification();
    };
    WindowSubscriber.prototype.unsubscribeClosingNotification = function() {
      if (this.closingNotification) {
        this.closingNotification.unsubscribe();
      }
    };
    WindowSubscriber.prototype.openWindow = function(innerSub) {
      if (innerSub === void 0) {
        innerSub = null;
      }
      if (innerSub) {
        this.remove(innerSub);
        innerSub.unsubscribe();
      }
      var prevWindow = this.window;
      if (prevWindow) {
        prevWindow.complete();
      }
      var window = this.window = new Subject_1.Subject();
      this.destination.next(window);
      var closingNotifier = tryCatch_1.tryCatch(this.closingSelector)();
      if (closingNotifier === errorObject_1.errorObject) {
        var err = errorObject_1.errorObject.e;
        this.destination.error(err);
        this.window.error(err);
      } else {
        this.add(this.closingNotification = subscribeToResult_1.subscribeToResult(this, closingNotifier));
        this.add(window);
      }
    };
    return WindowSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/withLatestFrom", ["rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function withLatestFrom() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i - 0] = arguments[_i];
    }
    var project;
    if (typeof args[args.length - 1] === 'function') {
      project = args.pop();
    }
    var observables = args;
    return this.lift(new WithLatestFromOperator(observables, project));
  }
  exports.withLatestFrom = withLatestFrom;
  var WithLatestFromOperator = (function() {
    function WithLatestFromOperator(observables, project) {
      this.observables = observables;
      this.project = project;
    }
    WithLatestFromOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new WithLatestFromSubscriber(subscriber, this.observables, this.project));
    };
    return WithLatestFromOperator;
  }());
  var WithLatestFromSubscriber = (function(_super) {
    __extends(WithLatestFromSubscriber, _super);
    function WithLatestFromSubscriber(destination, observables, project) {
      _super.call(this, destination);
      this.observables = observables;
      this.project = project;
      this.toRespond = [];
      var len = observables.length;
      this.values = new Array(len);
      for (var i = 0; i < len; i++) {
        this.toRespond.push(i);
      }
      for (var i = 0; i < len; i++) {
        var observable = observables[i];
        this.add(subscribeToResult_1.subscribeToResult(this, observable, observable, i));
      }
    }
    WithLatestFromSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      this.values[outerIndex] = innerValue;
      var toRespond = this.toRespond;
      if (toRespond.length > 0) {
        var found = toRespond.indexOf(outerIndex);
        if (found !== -1) {
          toRespond.splice(found, 1);
        }
      }
    };
    WithLatestFromSubscriber.prototype.notifyComplete = function() {};
    WithLatestFromSubscriber.prototype._next = function(value) {
      if (this.toRespond.length === 0) {
        var args = [value].concat(this.values);
        if (this.project) {
          this._tryProject(args);
        } else {
          this.destination.next(args);
        }
      }
    };
    WithLatestFromSubscriber.prototype._tryProject = function(args) {
      var result;
      try {
        result = this.project.apply(this, args);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      this.destination.next(result);
    };
    return WithLatestFromSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/zip", ["rxjs/Observable", "rxjs/operator/zip"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var zip_1 = require("rxjs/operator/zip");
  Observable_1.Observable.prototype.zip = zip_1.zipProto;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/zipAll", ["rxjs/operator/zip"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var zip_1 = require("rxjs/operator/zip");
  function zipAll(project) {
    return this.lift(new zip_1.ZipOperator(project));
  }
  exports.zipAll = zipAll;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/Operator", ["rxjs/Subscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Subscriber_1 = require("rxjs/Subscriber");
  var Operator = (function() {
    function Operator() {}
    Operator.prototype.call = function(subscriber, source) {
      return source._subscribe(new Subscriber_1.Subscriber(subscriber));
    };
    return Operator;
  }());
  exports.Operator = Operator;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/tryCatch", ["rxjs/util/errorObject"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var errorObject_1 = require("rxjs/util/errorObject");
  var tryCatchTarget;
  function tryCatcher() {
    try {
      return tryCatchTarget.apply(this, arguments);
    } catch (e) {
      errorObject_1.errorObject.e = e;
      return errorObject_1.errorObject;
    }
  }
  function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
  }
  exports.tryCatch = tryCatch;
  ;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/BoundCallbackObservable", ["rxjs/Observable", "rxjs/util/tryCatch", "rxjs/util/errorObject", "rxjs/AsyncSubject"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var tryCatch_1 = require("rxjs/util/tryCatch");
  var errorObject_1 = require("rxjs/util/errorObject");
  var AsyncSubject_1 = require("rxjs/AsyncSubject");
  var BoundCallbackObservable = (function(_super) {
    __extends(BoundCallbackObservable, _super);
    function BoundCallbackObservable(callbackFunc, selector, args, scheduler) {
      _super.call(this);
      this.callbackFunc = callbackFunc;
      this.selector = selector;
      this.args = args;
      this.scheduler = scheduler;
    }
    BoundCallbackObservable.create = function(callbackFunc, selector, scheduler) {
      if (selector === void 0) {
        selector = undefined;
      }
      return function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i - 0] = arguments[_i];
        }
        return new BoundCallbackObservable(callbackFunc, selector, args, scheduler);
      };
    };
    BoundCallbackObservable.prototype._subscribe = function(subscriber) {
      var callbackFunc = this.callbackFunc;
      var args = this.args;
      var scheduler = this.scheduler;
      var subject = this.subject;
      if (!scheduler) {
        if (!subject) {
          subject = this.subject = new AsyncSubject_1.AsyncSubject();
          var handler = function handlerFn() {
            var innerArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
              innerArgs[_i - 0] = arguments[_i];
            }
            var source = handlerFn.source;
            var selector = source.selector,
                subject = source.subject;
            if (selector) {
              var result_1 = tryCatch_1.tryCatch(selector).apply(this, innerArgs);
              if (result_1 === errorObject_1.errorObject) {
                subject.error(errorObject_1.errorObject.e);
              } else {
                subject.next(result_1);
                subject.complete();
              }
            } else {
              subject.next(innerArgs.length === 1 ? innerArgs[0] : innerArgs);
              subject.complete();
            }
          };
          handler.source = this;
          var result = tryCatch_1.tryCatch(callbackFunc).apply(this, args.concat(handler));
          if (result === errorObject_1.errorObject) {
            subject.error(errorObject_1.errorObject.e);
          }
        }
        return subject.subscribe(subscriber);
      } else {
        return scheduler.schedule(dispatch, 0, {
          source: this,
          subscriber: subscriber
        });
      }
    };
    return BoundCallbackObservable;
  }(Observable_1.Observable));
  exports.BoundCallbackObservable = BoundCallbackObservable;
  function dispatch(state) {
    var self = this;
    var source = state.source,
        subscriber = state.subscriber;
    var callbackFunc = source.callbackFunc,
        args = source.args,
        scheduler = source.scheduler;
    var subject = source.subject;
    if (!subject) {
      subject = source.subject = new AsyncSubject_1.AsyncSubject();
      var handler = function handlerFn() {
        var innerArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          innerArgs[_i - 0] = arguments[_i];
        }
        var source = handlerFn.source;
        var selector = source.selector,
            subject = source.subject;
        if (selector) {
          var result_2 = tryCatch_1.tryCatch(selector).apply(this, innerArgs);
          if (result_2 === errorObject_1.errorObject) {
            self.add(scheduler.schedule(dispatchError, 0, {
              err: errorObject_1.errorObject.e,
              subject: subject
            }));
          } else {
            self.add(scheduler.schedule(dispatchNext, 0, {
              value: result_2,
              subject: subject
            }));
          }
        } else {
          var value = innerArgs.length === 1 ? innerArgs[0] : innerArgs;
          self.add(scheduler.schedule(dispatchNext, 0, {
            value: value,
            subject: subject
          }));
        }
      };
      handler.source = source;
      var result = tryCatch_1.tryCatch(callbackFunc).apply(this, args.concat(handler));
      if (result === errorObject_1.errorObject) {
        subject.error(errorObject_1.errorObject.e);
      }
    }
    self.add(subject.subscribe(subscriber));
  }
  function dispatchNext(arg) {
    var value = arg.value,
        subject = arg.subject;
    subject.next(value);
    subject.complete();
  }
  function dispatchError(arg) {
    var err = arg.err,
        subject = arg.subject;
    subject.error(err);
  }
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/bindNodeCallback", ["rxjs/observable/BoundNodeCallbackObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var BoundNodeCallbackObservable_1 = require("rxjs/observable/BoundNodeCallbackObservable");
  exports.bindNodeCallback = BoundNodeCallbackObservable_1.BoundNodeCallbackObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/ArrayObservable", ["rxjs/Observable", "rxjs/observable/ScalarObservable", "rxjs/observable/EmptyObservable", "rxjs/util/isScheduler"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var ScalarObservable_1 = require("rxjs/observable/ScalarObservable");
  var EmptyObservable_1 = require("rxjs/observable/EmptyObservable");
  var isScheduler_1 = require("rxjs/util/isScheduler");
  var ArrayObservable = (function(_super) {
    __extends(ArrayObservable, _super);
    function ArrayObservable(array, scheduler) {
      _super.call(this);
      this.array = array;
      this.scheduler = scheduler;
      if (!scheduler && array.length === 1) {
        this._isScalar = true;
        this.value = array[0];
      }
    }
    ArrayObservable.create = function(array, scheduler) {
      return new ArrayObservable(array, scheduler);
    };
    ArrayObservable.of = function() {
      var array = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        array[_i - 0] = arguments[_i];
      }
      var scheduler = array[array.length - 1];
      if (isScheduler_1.isScheduler(scheduler)) {
        array.pop();
      } else {
        scheduler = null;
      }
      var len = array.length;
      if (len > 1) {
        return new ArrayObservable(array, scheduler);
      } else if (len === 1) {
        return new ScalarObservable_1.ScalarObservable(array[0], scheduler);
      } else {
        return new EmptyObservable_1.EmptyObservable(scheduler);
      }
    };
    ArrayObservable.dispatch = function(state) {
      var array = state.array,
          index = state.index,
          count = state.count,
          subscriber = state.subscriber;
      if (index >= count) {
        subscriber.complete();
        return ;
      }
      subscriber.next(array[index]);
      if (subscriber.isUnsubscribed) {
        return ;
      }
      state.index = index + 1;
      this.schedule(state);
    };
    ArrayObservable.prototype._subscribe = function(subscriber) {
      var index = 0;
      var array = this.array;
      var count = array.length;
      var scheduler = this.scheduler;
      if (scheduler) {
        return scheduler.schedule(ArrayObservable.dispatch, 0, {
          array: array,
          index: index,
          count: count,
          subscriber: subscriber
        });
      } else {
        for (var i = 0; i < count && !subscriber.isUnsubscribed; i++) {
          subscriber.next(array[i]);
        }
        subscriber.complete();
      }
    };
    return ArrayObservable;
  }(Observable_1.Observable));
  exports.ArrayObservable = ArrayObservable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/subscribeToResult", ["rxjs/util/root", "rxjs/util/isArray", "rxjs/util/isPromise", "rxjs/Observable", "rxjs/symbol/iterator", "rxjs/symbol/observable", "rxjs/InnerSubscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var root_1 = require("rxjs/util/root");
  var isArray_1 = require("rxjs/util/isArray");
  var isPromise_1 = require("rxjs/util/isPromise");
  var Observable_1 = require("rxjs/Observable");
  var iterator_1 = require("rxjs/symbol/iterator");
  var observable_1 = require("rxjs/symbol/observable");
  var InnerSubscriber_1 = require("rxjs/InnerSubscriber");
  function subscribeToResult(outerSubscriber, result, outerValue, outerIndex) {
    var destination = new InnerSubscriber_1.InnerSubscriber(outerSubscriber, outerValue, outerIndex);
    if (destination.isUnsubscribed) {
      return ;
    }
    if (result instanceof Observable_1.Observable) {
      if (result._isScalar) {
        destination.next(result.value);
        destination.complete();
        return ;
      } else {
        return result.subscribe(destination);
      }
    }
    if (isArray_1.isArray(result)) {
      for (var i = 0,
          len = result.length; i < len && !destination.isUnsubscribed; i++) {
        destination.next(result[i]);
      }
      if (!destination.isUnsubscribed) {
        destination.complete();
      }
    } else if (isPromise_1.isPromise(result)) {
      result.then(function(value) {
        if (!destination.isUnsubscribed) {
          destination.next(value);
          destination.complete();
        }
      }, function(err) {
        return destination.error(err);
      }).then(null, function(err) {
        root_1.root.setTimeout(function() {
          throw err;
        });
      });
      return destination;
    } else if (typeof result[iterator_1.$$iterator] === 'function') {
      for (var _i = 0,
          _a = result; _i < _a.length; _i++) {
        var item = _a[_i];
        destination.next(item);
        if (destination.isUnsubscribed) {
          break;
        }
      }
      if (!destination.isUnsubscribed) {
        destination.complete();
      }
    } else if (typeof result[observable_1.$$observable] === 'function') {
      var obs = result[observable_1.$$observable]();
      if (typeof obs.subscribe !== 'function') {
        destination.error('invalid observable');
      } else {
        return obs.subscribe(new InnerSubscriber_1.InnerSubscriber(outerSubscriber, outerValue, outerIndex));
      }
    } else {
      destination.error(new TypeError('unknown type returned'));
    }
  }
  exports.subscribeToResult = subscribeToResult;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/concat", ["rxjs/util/isScheduler", "rxjs/observable/ArrayObservable", "rxjs/operator/mergeAll"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var isScheduler_1 = require("rxjs/util/isScheduler");
  var ArrayObservable_1 = require("rxjs/observable/ArrayObservable");
  var mergeAll_1 = require("rxjs/operator/mergeAll");
  function concat() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      observables[_i - 0] = arguments[_i];
    }
    return concatStatic.apply(void 0, [this].concat(observables));
  }
  exports.concat = concat;
  function concatStatic() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      observables[_i - 0] = arguments[_i];
    }
    var scheduler = null;
    var args = observables;
    if (isScheduler_1.isScheduler(args[observables.length - 1])) {
      scheduler = args.pop();
    }
    return new ArrayObservable_1.ArrayObservable(observables, scheduler).lift(new mergeAll_1.MergeAllOperator(1));
  }
  exports.concatStatic = concatStatic;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/defer", ["rxjs/observable/DeferObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var DeferObservable_1 = require("rxjs/observable/DeferObservable");
  exports.defer = DeferObservable_1.DeferObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/empty", ["rxjs/Observable", "rxjs/observable/empty"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var empty_1 = require("rxjs/observable/empty");
  Observable_1.Observable.empty = empty_1.empty;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/forkJoin", ["rxjs/observable/ForkJoinObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var ForkJoinObservable_1 = require("rxjs/observable/ForkJoinObservable");
  exports.forkJoin = ForkJoinObservable_1.ForkJoinObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/observeOn", ["rxjs/Subscriber", "rxjs/Notification"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var Notification_1 = require("rxjs/Notification");
  function observeOn(scheduler, delay) {
    if (delay === void 0) {
      delay = 0;
    }
    return this.lift(new ObserveOnOperator(scheduler, delay));
  }
  exports.observeOn = observeOn;
  var ObserveOnOperator = (function() {
    function ObserveOnOperator(scheduler, delay) {
      if (delay === void 0) {
        delay = 0;
      }
      this.scheduler = scheduler;
      this.delay = delay;
    }
    ObserveOnOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new ObserveOnSubscriber(subscriber, this.scheduler, this.delay));
    };
    return ObserveOnOperator;
  }());
  exports.ObserveOnOperator = ObserveOnOperator;
  var ObserveOnSubscriber = (function(_super) {
    __extends(ObserveOnSubscriber, _super);
    function ObserveOnSubscriber(destination, scheduler, delay) {
      if (delay === void 0) {
        delay = 0;
      }
      _super.call(this, destination);
      this.scheduler = scheduler;
      this.delay = delay;
    }
    ObserveOnSubscriber.dispatch = function(arg) {
      var notification = arg.notification,
          destination = arg.destination;
      notification.observe(destination);
    };
    ObserveOnSubscriber.prototype.scheduleMessage = function(notification) {
      this.add(this.scheduler.schedule(ObserveOnSubscriber.dispatch, this.delay, new ObserveOnMessage(notification, this.destination)));
    };
    ObserveOnSubscriber.prototype._next = function(value) {
      this.scheduleMessage(Notification_1.Notification.createNext(value));
    };
    ObserveOnSubscriber.prototype._error = function(err) {
      this.scheduleMessage(Notification_1.Notification.createError(err));
    };
    ObserveOnSubscriber.prototype._complete = function() {
      this.scheduleMessage(Notification_1.Notification.createComplete());
    };
    return ObserveOnSubscriber;
  }(Subscriber_1.Subscriber));
  exports.ObserveOnSubscriber = ObserveOnSubscriber;
  var ObserveOnMessage = (function() {
    function ObserveOnMessage(notification, destination) {
      this.notification = notification;
      this.destination = destination;
    }
    return ObserveOnMessage;
  }());
  exports.ObserveOnMessage = ObserveOnMessage;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/fromEvent", ["rxjs/observable/FromEventObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var FromEventObservable_1 = require("rxjs/observable/FromEventObservable");
  exports.fromEvent = FromEventObservable_1.FromEventObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/fromEventPattern", ["rxjs/observable/FromEventPatternObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var FromEventPatternObservable_1 = require("rxjs/observable/FromEventPatternObservable");
  exports.fromEventPattern = FromEventPatternObservable_1.FromEventPatternObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/fromPromise", ["rxjs/Observable", "rxjs/observable/fromPromise"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var fromPromise_1 = require("rxjs/observable/fromPromise");
  Observable_1.Observable.fromPromise = fromPromise_1.fromPromise;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/scheduler/QueueScheduler", ["rxjs/scheduler/QueueAction", "rxjs/scheduler/FutureAction"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var QueueAction_1 = require("rxjs/scheduler/QueueAction");
  var FutureAction_1 = require("rxjs/scheduler/FutureAction");
  var QueueScheduler = (function() {
    function QueueScheduler() {
      this.active = false;
      this.actions = [];
      this.scheduledId = null;
    }
    QueueScheduler.prototype.now = function() {
      return Date.now();
    };
    QueueScheduler.prototype.flush = function() {
      if (this.active || this.scheduledId) {
        return ;
      }
      this.active = true;
      var actions = this.actions;
      for (var action = null; action = actions.shift(); ) {
        action.execute();
        if (action.error) {
          this.active = false;
          throw action.error;
        }
      }
      this.active = false;
    };
    QueueScheduler.prototype.schedule = function(work, delay, state) {
      if (delay === void 0) {
        delay = 0;
      }
      return (delay <= 0) ? this.scheduleNow(work, state) : this.scheduleLater(work, delay, state);
    };
    QueueScheduler.prototype.scheduleNow = function(work, state) {
      return new QueueAction_1.QueueAction(this, work).schedule(state);
    };
    QueueScheduler.prototype.scheduleLater = function(work, delay, state) {
      return new FutureAction_1.FutureAction(this, work).schedule(state, delay);
    };
    return QueueScheduler;
  }());
  exports.QueueScheduler = QueueScheduler;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/merge", ["rxjs/operator/merge"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var merge_1 = require("rxjs/operator/merge");
  exports.merge = merge_1.mergeStatic;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/race", ["rxjs/Observable", "rxjs/operator/race"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var race_1 = require("rxjs/operator/race");
  Observable_1.Observable.race = race_1.raceStatic;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/NeverObservable", ["rxjs/Observable", "rxjs/util/noop"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var noop_1 = require("rxjs/util/noop");
  var NeverObservable = (function(_super) {
    __extends(NeverObservable, _super);
    function NeverObservable() {
      _super.call(this);
    }
    NeverObservable.create = function() {
      return new NeverObservable();
    };
    NeverObservable.prototype._subscribe = function(subscriber) {
      noop_1.noop();
    };
    return NeverObservable;
  }(Observable_1.Observable));
  exports.NeverObservable = NeverObservable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/of", ["rxjs/Observable", "rxjs/observable/of"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var of_1 = require("rxjs/observable/of");
  Observable_1.Observable.of = of_1.of;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/range", ["rxjs/observable/RangeObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var RangeObservable_1 = require("rxjs/observable/RangeObservable");
  exports.range = RangeObservable_1.RangeObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/throw", ["rxjs/observable/ErrorObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var ErrorObservable_1 = require("rxjs/observable/ErrorObservable");
  exports._throw = ErrorObservable_1.ErrorObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/TimerObservable", ["rxjs/util/isNumeric", "rxjs/Observable", "rxjs/scheduler/async", "rxjs/util/isScheduler", "rxjs/util/isDate"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var isNumeric_1 = require("rxjs/util/isNumeric");
  var Observable_1 = require("rxjs/Observable");
  var async_1 = require("rxjs/scheduler/async");
  var isScheduler_1 = require("rxjs/util/isScheduler");
  var isDate_1 = require("rxjs/util/isDate");
  var TimerObservable = (function(_super) {
    __extends(TimerObservable, _super);
    function TimerObservable(dueTime, period, scheduler) {
      if (dueTime === void 0) {
        dueTime = 0;
      }
      _super.call(this);
      this.period = -1;
      this.dueTime = 0;
      if (isNumeric_1.isNumeric(period)) {
        this.period = Number(period) < 1 && 1 || Number(period);
      } else if (isScheduler_1.isScheduler(period)) {
        scheduler = period;
      }
      if (!isScheduler_1.isScheduler(scheduler)) {
        scheduler = async_1.async;
      }
      this.scheduler = scheduler;
      this.dueTime = isDate_1.isDate(dueTime) ? (+dueTime - this.scheduler.now()) : dueTime;
    }
    TimerObservable.create = function(initialDelay, period, scheduler) {
      if (initialDelay === void 0) {
        initialDelay = 0;
      }
      return new TimerObservable(initialDelay, period, scheduler);
    };
    TimerObservable.dispatch = function(state) {
      var index = state.index,
          period = state.period,
          subscriber = state.subscriber;
      var action = this;
      subscriber.next(index);
      if (subscriber.isUnsubscribed) {
        return ;
      } else if (period === -1) {
        return subscriber.complete();
      }
      state.index = index + 1;
      action.schedule(state, period);
    };
    TimerObservable.prototype._subscribe = function(subscriber) {
      var index = 0;
      var _a = this,
          period = _a.period,
          dueTime = _a.dueTime,
          scheduler = _a.scheduler;
      return scheduler.schedule(TimerObservable.dispatch, dueTime, {
        index: index,
        period: period,
        subscriber: subscriber
      });
    };
    return TimerObservable;
  }(Observable_1.Observable));
  exports.TimerObservable = TimerObservable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/zip", ["rxjs/operator/zip"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var zip_1 = require("rxjs/operator/zip");
  exports.zip = zip_1.zipStatic;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/buffer", ["rxjs/Observable", "rxjs/operator/buffer"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var buffer_1 = require("rxjs/operator/buffer");
  Observable_1.Observable.prototype.buffer = buffer_1.buffer;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/bufferCount", ["rxjs/Observable", "rxjs/operator/bufferCount"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var bufferCount_1 = require("rxjs/operator/bufferCount");
  Observable_1.Observable.prototype.bufferCount = bufferCount_1.bufferCount;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/bufferTime", ["rxjs/Observable", "rxjs/operator/bufferTime"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var bufferTime_1 = require("rxjs/operator/bufferTime");
  Observable_1.Observable.prototype.bufferTime = bufferTime_1.bufferTime;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/bufferToggle", ["rxjs/Observable", "rxjs/operator/bufferToggle"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var bufferToggle_1 = require("rxjs/operator/bufferToggle");
  Observable_1.Observable.prototype.bufferToggle = bufferToggle_1.bufferToggle;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/bufferWhen", ["rxjs/Observable", "rxjs/operator/bufferWhen"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var bufferWhen_1 = require("rxjs/operator/bufferWhen");
  Observable_1.Observable.prototype.bufferWhen = bufferWhen_1.bufferWhen;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/ReplaySubject", ["rxjs/Subject", "rxjs/scheduler/queue", "rxjs/operator/observeOn"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subject_1 = require("rxjs/Subject");
  var queue_1 = require("rxjs/scheduler/queue");
  var observeOn_1 = require("rxjs/operator/observeOn");
  var ReplaySubject = (function(_super) {
    __extends(ReplaySubject, _super);
    function ReplaySubject(bufferSize, windowTime, scheduler) {
      if (bufferSize === void 0) {
        bufferSize = Number.POSITIVE_INFINITY;
      }
      if (windowTime === void 0) {
        windowTime = Number.POSITIVE_INFINITY;
      }
      _super.call(this);
      this.events = [];
      this.scheduler = scheduler;
      this.bufferSize = bufferSize < 1 ? 1 : bufferSize;
      this._windowTime = windowTime < 1 ? 1 : windowTime;
    }
    ReplaySubject.prototype._next = function(value) {
      var now = this._getNow();
      this.events.push(new ReplayEvent(now, value));
      this._trimBufferThenGetEvents(now);
      _super.prototype._next.call(this, value);
    };
    ReplaySubject.prototype._subscribe = function(subscriber) {
      var events = this._trimBufferThenGetEvents(this._getNow());
      var scheduler = this.scheduler;
      if (scheduler) {
        subscriber.add(subscriber = new observeOn_1.ObserveOnSubscriber(subscriber, scheduler));
      }
      var index = -1;
      var len = events.length;
      while (++index < len && !subscriber.isUnsubscribed) {
        subscriber.next(events[index].value);
      }
      return _super.prototype._subscribe.call(this, subscriber);
    };
    ReplaySubject.prototype._getNow = function() {
      return (this.scheduler || queue_1.queue).now();
    };
    ReplaySubject.prototype._trimBufferThenGetEvents = function(now) {
      var bufferSize = this.bufferSize;
      var _windowTime = this._windowTime;
      var events = this.events;
      var eventsCount = events.length;
      var spliceCount = 0;
      while (spliceCount < eventsCount) {
        if ((now - events[spliceCount].time) < _windowTime) {
          break;
        }
        spliceCount += 1;
      }
      if (eventsCount > bufferSize) {
        spliceCount = Math.max(spliceCount, eventsCount - bufferSize);
      }
      if (spliceCount > 0) {
        events.splice(0, spliceCount);
      }
      return events;
    };
    return ReplaySubject;
  }(Subject_1.Subject));
  exports.ReplaySubject = ReplaySubject;
  var ReplayEvent = (function() {
    function ReplayEvent(time, value) {
      this.time = time;
      this.value = value;
    }
    return ReplayEvent;
  }());
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/multicast", ["rxjs/observable/ConnectableObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var ConnectableObservable_1 = require("rxjs/observable/ConnectableObservable");
  function multicast(subjectOrSubjectFactory) {
    var subjectFactory;
    if (typeof subjectOrSubjectFactory === 'function') {
      subjectFactory = subjectOrSubjectFactory;
    } else {
      subjectFactory = function subjectFactory() {
        return subjectOrSubjectFactory;
      };
    }
    return new ConnectableObservable_1.ConnectableObservable(this, subjectFactory);
  }
  exports.multicast = multicast;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/catch", ["rxjs/Observable", "rxjs/operator/catch"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var catch_1 = require("rxjs/operator/catch");
  Observable_1.Observable.prototype.catch = catch_1._catch;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/combineAll", ["rxjs/Observable", "rxjs/operator/combineAll"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var combineAll_1 = require("rxjs/operator/combineAll");
  Observable_1.Observable.prototype.combineAll = combineAll_1.combineAll;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/concatAll", ["rxjs/Observable", "rxjs/operator/concatAll"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var concatAll_1 = require("rxjs/operator/concatAll");
  Observable_1.Observable.prototype.concatAll = concatAll_1.concatAll;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/concatMap", ["rxjs/operator/mergeMap"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var mergeMap_1 = require("rxjs/operator/mergeMap");
  function concatMap(project, resultSelector) {
    return this.lift(new mergeMap_1.MergeMapOperator(project, resultSelector, 1));
  }
  exports.concatMap = concatMap;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/concatMapTo", ["rxjs/operator/mergeMapTo"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var mergeMapTo_1 = require("rxjs/operator/mergeMapTo");
  function concatMapTo(innerObservable, resultSelector) {
    return this.lift(new mergeMapTo_1.MergeMapToOperator(innerObservable, resultSelector, 1));
  }
  exports.concatMapTo = concatMapTo;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/count", ["rxjs/Observable", "rxjs/operator/count"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var count_1 = require("rxjs/operator/count");
  Observable_1.Observable.prototype.count = count_1.count;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/dematerialize", ["rxjs/Observable", "rxjs/operator/dematerialize"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var dematerialize_1 = require("rxjs/operator/dematerialize");
  Observable_1.Observable.prototype.dematerialize = dematerialize_1.dematerialize;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/debounce", ["rxjs/Observable", "rxjs/operator/debounce"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var debounce_1 = require("rxjs/operator/debounce");
  Observable_1.Observable.prototype.debounce = debounce_1.debounce;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/debounceTime", ["rxjs/Observable", "rxjs/operator/debounceTime"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var debounceTime_1 = require("rxjs/operator/debounceTime");
  Observable_1.Observable.prototype.debounceTime = debounceTime_1.debounceTime;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/defaultIfEmpty", ["rxjs/Observable", "rxjs/operator/defaultIfEmpty"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var defaultIfEmpty_1 = require("rxjs/operator/defaultIfEmpty");
  Observable_1.Observable.prototype.defaultIfEmpty = defaultIfEmpty_1.defaultIfEmpty;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/delay", ["rxjs/Observable", "rxjs/operator/delay"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var delay_1 = require("rxjs/operator/delay");
  Observable_1.Observable.prototype.delay = delay_1.delay;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/delayWhen", ["rxjs/Observable", "rxjs/operator/delayWhen"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var delayWhen_1 = require("rxjs/operator/delayWhen");
  Observable_1.Observable.prototype.delayWhen = delayWhen_1.delayWhen;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/distinctUntilChanged", ["rxjs/Observable", "rxjs/operator/distinctUntilChanged"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var distinctUntilChanged_1 = require("rxjs/operator/distinctUntilChanged");
  Observable_1.Observable.prototype.distinctUntilChanged = distinctUntilChanged_1.distinctUntilChanged;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/do", ["rxjs/Observable", "rxjs/operator/do"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var do_1 = require("rxjs/operator/do");
  Observable_1.Observable.prototype.do = do_1._do;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/expand", ["rxjs/Observable", "rxjs/operator/expand"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var expand_1 = require("rxjs/operator/expand");
  Observable_1.Observable.prototype.expand = expand_1.expand;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/filter", ["rxjs/Observable", "rxjs/operator/filter"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var filter_1 = require("rxjs/operator/filter");
  Observable_1.Observable.prototype.filter = filter_1.filter;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/finally", ["rxjs/Observable", "rxjs/operator/finally"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var finally_1 = require("rxjs/operator/finally");
  Observable_1.Observable.prototype.finally = finally_1._finally;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/first", ["rxjs/Subscriber", "rxjs/util/EmptyError"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var EmptyError_1 = require("rxjs/util/EmptyError");
  function first(predicate, resultSelector, defaultValue) {
    return this.lift(new FirstOperator(predicate, resultSelector, defaultValue, this));
  }
  exports.first = first;
  var FirstOperator = (function() {
    function FirstOperator(predicate, resultSelector, defaultValue, source) {
      this.predicate = predicate;
      this.resultSelector = resultSelector;
      this.defaultValue = defaultValue;
      this.source = source;
    }
    FirstOperator.prototype.call = function(observer, source) {
      return source._subscribe(new FirstSubscriber(observer, this.predicate, this.resultSelector, this.defaultValue, this.source));
    };
    return FirstOperator;
  }());
  var FirstSubscriber = (function(_super) {
    __extends(FirstSubscriber, _super);
    function FirstSubscriber(destination, predicate, resultSelector, defaultValue, source) {
      _super.call(this, destination);
      this.predicate = predicate;
      this.resultSelector = resultSelector;
      this.defaultValue = defaultValue;
      this.source = source;
      this.index = 0;
      this.hasCompleted = false;
    }
    FirstSubscriber.prototype._next = function(value) {
      var index = this.index++;
      if (this.predicate) {
        this._tryPredicate(value, index);
      } else {
        this._emit(value, index);
      }
    };
    FirstSubscriber.prototype._tryPredicate = function(value, index) {
      var result;
      try {
        result = this.predicate(value, index, this.source);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      if (result) {
        this._emit(value, index);
      }
    };
    FirstSubscriber.prototype._emit = function(value, index) {
      if (this.resultSelector) {
        this._tryResultSelector(value, index);
        return ;
      }
      this._emitFinal(value);
    };
    FirstSubscriber.prototype._tryResultSelector = function(value, index) {
      var result;
      try {
        result = this.resultSelector(value, index);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      this._emitFinal(result);
    };
    FirstSubscriber.prototype._emitFinal = function(value) {
      var destination = this.destination;
      destination.next(value);
      destination.complete();
      this.hasCompleted = true;
    };
    FirstSubscriber.prototype._complete = function() {
      var destination = this.destination;
      if (!this.hasCompleted && typeof this.defaultValue !== 'undefined') {
        destination.next(this.defaultValue);
        destination.complete();
      } else if (!this.hasCompleted) {
        destination.error(new EmptyError_1.EmptyError);
      }
    };
    return FirstSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/Map", ["rxjs/util/root", "rxjs/util/MapPolyfill"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var root_1 = require("rxjs/util/root");
  var MapPolyfill_1 = require("rxjs/util/MapPolyfill");
  exports.Map = root_1.root.Map || (function() {
    return MapPolyfill_1.MapPolyfill;
  })();
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/ignoreElements", ["rxjs/Observable", "rxjs/operator/ignoreElements"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var ignoreElements_1 = require("rxjs/operator/ignoreElements");
  Observable_1.Observable.prototype.ignoreElements = ignoreElements_1.ignoreElements;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/audit", ["rxjs/Observable", "rxjs/operator/audit"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var audit_1 = require("rxjs/operator/audit");
  Observable_1.Observable.prototype.audit = audit_1.audit;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/auditTime", ["rxjs/Observable", "rxjs/operator/auditTime"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var auditTime_1 = require("rxjs/operator/auditTime");
  Observable_1.Observable.prototype.auditTime = auditTime_1.auditTime;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/last", ["rxjs/Observable", "rxjs/operator/last"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var last_1 = require("rxjs/operator/last");
  Observable_1.Observable.prototype.last = last_1.last;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/let", ["rxjs/Observable", "rxjs/operator/let"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var let_1 = require("rxjs/operator/let");
  Observable_1.Observable.prototype.let = let_1.letProto;
  Observable_1.Observable.prototype.letBind = let_1.letProto;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/every", ["rxjs/Observable", "rxjs/operator/every"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var every_1 = require("rxjs/operator/every");
  Observable_1.Observable.prototype.every = every_1.every;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/map", ["rxjs/Observable", "rxjs/operator/map"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var map_1 = require("rxjs/operator/map");
  Observable_1.Observable.prototype.map = map_1.map;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/mapTo", ["rxjs/Observable", "rxjs/operator/mapTo"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var mapTo_1 = require("rxjs/operator/mapTo");
  Observable_1.Observable.prototype.mapTo = mapTo_1.mapTo;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/materialize", ["rxjs/Observable", "rxjs/operator/materialize"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var materialize_1 = require("rxjs/operator/materialize");
  Observable_1.Observable.prototype.materialize = materialize_1.materialize;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/partition", ["rxjs/util/not", "rxjs/operator/filter"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var not_1 = require("rxjs/util/not");
  var filter_1 = require("rxjs/operator/filter");
  function partition(predicate, thisArg) {
    return [filter_1.filter.call(this, predicate), filter_1.filter.call(this, not_1.not(predicate, thisArg))];
  }
  exports.partition = partition;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/pluck", ["rxjs/Observable", "rxjs/operator/pluck"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var pluck_1 = require("rxjs/operator/pluck");
  Observable_1.Observable.prototype.pluck = pluck_1.pluck;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/publish", ["rxjs/Observable", "rxjs/operator/publish"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var publish_1 = require("rxjs/operator/publish");
  Observable_1.Observable.prototype.publish = publish_1.publish;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/publishBehavior", ["rxjs/BehaviorSubject", "rxjs/operator/multicast"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var BehaviorSubject_1 = require("rxjs/BehaviorSubject");
  var multicast_1 = require("rxjs/operator/multicast");
  function publishBehavior(value) {
    return multicast_1.multicast.call(this, new BehaviorSubject_1.BehaviorSubject(value));
  }
  exports.publishBehavior = publishBehavior;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/publishLast", ["rxjs/Observable", "rxjs/operator/publishLast"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var publishLast_1 = require("rxjs/operator/publishLast");
  Observable_1.Observable.prototype.publishLast = publishLast_1.publishLast;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/reduce", ["rxjs/Observable", "rxjs/operator/reduce"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var reduce_1 = require("rxjs/operator/reduce");
  Observable_1.Observable.prototype.reduce = reduce_1.reduce;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/repeat", ["rxjs/Observable", "rxjs/operator/repeat"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var repeat_1 = require("rxjs/operator/repeat");
  Observable_1.Observable.prototype.repeat = repeat_1.repeat;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/retry", ["rxjs/Observable", "rxjs/operator/retry"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var retry_1 = require("rxjs/operator/retry");
  Observable_1.Observable.prototype.retry = retry_1.retry;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/retryWhen", ["rxjs/Observable", "rxjs/operator/retryWhen"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var retryWhen_1 = require("rxjs/operator/retryWhen");
  Observable_1.Observable.prototype.retryWhen = retryWhen_1.retryWhen;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/sample", ["rxjs/Observable", "rxjs/operator/sample"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var sample_1 = require("rxjs/operator/sample");
  Observable_1.Observable.prototype.sample = sample_1.sample;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/sampleTime", ["rxjs/Observable", "rxjs/operator/sampleTime"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var sampleTime_1 = require("rxjs/operator/sampleTime");
  Observable_1.Observable.prototype.sampleTime = sampleTime_1.sampleTime;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/scan", ["rxjs/Observable", "rxjs/operator/scan"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var scan_1 = require("rxjs/operator/scan");
  Observable_1.Observable.prototype.scan = scan_1.scan;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/share", ["rxjs/Observable", "rxjs/operator/share"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var share_1 = require("rxjs/operator/share");
  Observable_1.Observable.prototype.share = share_1.share;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/single", ["rxjs/Observable", "rxjs/operator/single"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var single_1 = require("rxjs/operator/single");
  Observable_1.Observable.prototype.single = single_1.single;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/skip", ["rxjs/Observable", "rxjs/operator/skip"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var skip_1 = require("rxjs/operator/skip");
  Observable_1.Observable.prototype.skip = skip_1.skip;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/skipUntil", ["rxjs/Observable", "rxjs/operator/skipUntil"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var skipUntil_1 = require("rxjs/operator/skipUntil");
  Observable_1.Observable.prototype.skipUntil = skipUntil_1.skipUntil;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/skipWhile", ["rxjs/Observable", "rxjs/operator/skipWhile"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var skipWhile_1 = require("rxjs/operator/skipWhile");
  Observable_1.Observable.prototype.skipWhile = skipWhile_1.skipWhile;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/startWith", ["rxjs/Observable", "rxjs/operator/startWith"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var startWith_1 = require("rxjs/operator/startWith");
  Observable_1.Observable.prototype.startWith = startWith_1.startWith;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/scheduler/AsapAction", ["rxjs/util/Immediate", "rxjs/scheduler/FutureAction"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Immediate_1 = require("rxjs/util/Immediate");
  var FutureAction_1 = require("rxjs/scheduler/FutureAction");
  var AsapAction = (function(_super) {
    __extends(AsapAction, _super);
    function AsapAction() {
      _super.apply(this, arguments);
    }
    AsapAction.prototype._schedule = function(state, delay) {
      if (delay === void 0) {
        delay = 0;
      }
      if (delay > 0) {
        return _super.prototype._schedule.call(this, state, delay);
      }
      this.delay = delay;
      this.state = state;
      var scheduler = this.scheduler;
      scheduler.actions.push(this);
      if (!scheduler.scheduledId) {
        scheduler.scheduledId = Immediate_1.Immediate.setImmediate(function() {
          scheduler.scheduledId = null;
          scheduler.flush();
        });
      }
      return this;
    };
    AsapAction.prototype._unsubscribe = function() {
      var scheduler = this.scheduler;
      var scheduledId = scheduler.scheduledId,
          actions = scheduler.actions;
      _super.prototype._unsubscribe.call(this);
      if (actions.length === 0) {
        scheduler.active = false;
        if (scheduledId != null) {
          scheduler.scheduledId = null;
          Immediate_1.Immediate.clearImmediate(scheduledId);
        }
      }
    };
    return AsapAction;
  }(FutureAction_1.FutureAction));
  exports.AsapAction = AsapAction;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/switch", ["rxjs/Observable", "rxjs/operator/switch"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var switch_1 = require("rxjs/operator/switch");
  Observable_1.Observable.prototype.switch = switch_1._switch;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/switchMap", ["rxjs/Observable", "rxjs/operator/switchMap"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var switchMap_1 = require("rxjs/operator/switchMap");
  Observable_1.Observable.prototype.switchMap = switchMap_1.switchMap;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/switchMapTo", ["rxjs/Observable", "rxjs/operator/switchMapTo"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var switchMapTo_1 = require("rxjs/operator/switchMapTo");
  Observable_1.Observable.prototype.switchMapTo = switchMapTo_1.switchMapTo;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/take", ["rxjs/Subscriber", "rxjs/util/ArgumentOutOfRangeError", "rxjs/observable/EmptyObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var ArgumentOutOfRangeError_1 = require("rxjs/util/ArgumentOutOfRangeError");
  var EmptyObservable_1 = require("rxjs/observable/EmptyObservable");
  function take(total) {
    if (total === 0) {
      return new EmptyObservable_1.EmptyObservable();
    } else {
      return this.lift(new TakeOperator(total));
    }
  }
  exports.take = take;
  var TakeOperator = (function() {
    function TakeOperator(total) {
      this.total = total;
      if (this.total < 0) {
        throw new ArgumentOutOfRangeError_1.ArgumentOutOfRangeError;
      }
    }
    TakeOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new TakeSubscriber(subscriber, this.total));
    };
    return TakeOperator;
  }());
  var TakeSubscriber = (function(_super) {
    __extends(TakeSubscriber, _super);
    function TakeSubscriber(destination, total) {
      _super.call(this, destination);
      this.total = total;
      this.count = 0;
    }
    TakeSubscriber.prototype._next = function(value) {
      var total = this.total;
      if (++this.count <= total) {
        this.destination.next(value);
        if (this.count === total) {
          this.destination.complete();
          this.unsubscribe();
        }
      }
    };
    return TakeSubscriber;
  }(Subscriber_1.Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/takeLast", ["rxjs/Observable", "rxjs/operator/takeLast"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var takeLast_1 = require("rxjs/operator/takeLast");
  Observable_1.Observable.prototype.takeLast = takeLast_1.takeLast;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/takeUntil", ["rxjs/Observable", "rxjs/operator/takeUntil"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var takeUntil_1 = require("rxjs/operator/takeUntil");
  Observable_1.Observable.prototype.takeUntil = takeUntil_1.takeUntil;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/takeWhile", ["rxjs/Observable", "rxjs/operator/takeWhile"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var takeWhile_1 = require("rxjs/operator/takeWhile");
  Observable_1.Observable.prototype.takeWhile = takeWhile_1.takeWhile;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/throttle", ["rxjs/Observable", "rxjs/operator/throttle"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var throttle_1 = require("rxjs/operator/throttle");
  Observable_1.Observable.prototype.throttle = throttle_1.throttle;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/throttleTime", ["rxjs/Observable", "rxjs/operator/throttleTime"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var throttleTime_1 = require("rxjs/operator/throttleTime");
  Observable_1.Observable.prototype.throttleTime = throttleTime_1.throttleTime;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/timeout", ["rxjs/Observable", "rxjs/operator/timeout"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var timeout_1 = require("rxjs/operator/timeout");
  Observable_1.Observable.prototype.timeout = timeout_1.timeout;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/timeoutWith", ["rxjs/Observable", "rxjs/operator/timeoutWith"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var timeoutWith_1 = require("rxjs/operator/timeoutWith");
  Observable_1.Observable.prototype.timeoutWith = timeoutWith_1.timeoutWith;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/toArray", ["rxjs/Observable", "rxjs/operator/toArray"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var toArray_1 = require("rxjs/operator/toArray");
  Observable_1.Observable.prototype.toArray = toArray_1.toArray;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/toPromise", ["rxjs/Observable", "rxjs/operator/toPromise"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var toPromise_1 = require("rxjs/operator/toPromise");
  Observable_1.Observable.prototype.toPromise = toPromise_1.toPromise;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/window", ["rxjs/Observable", "rxjs/operator/window"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var window_1 = require("rxjs/operator/window");
  Observable_1.Observable.prototype.window = window_1.window;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/windowCount", ["rxjs/Observable", "rxjs/operator/windowCount"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var windowCount_1 = require("rxjs/operator/windowCount");
  Observable_1.Observable.prototype.windowCount = windowCount_1.windowCount;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/windowTime", ["rxjs/Observable", "rxjs/operator/windowTime"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var windowTime_1 = require("rxjs/operator/windowTime");
  Observable_1.Observable.prototype.windowTime = windowTime_1.windowTime;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/windowToggle", ["rxjs/Observable", "rxjs/operator/windowToggle"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var windowToggle_1 = require("rxjs/operator/windowToggle");
  Observable_1.Observable.prototype.windowToggle = windowToggle_1.windowToggle;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/windowWhen", ["rxjs/Observable", "rxjs/operator/windowWhen"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var windowWhen_1 = require("rxjs/operator/windowWhen");
  Observable_1.Observable.prototype.windowWhen = windowWhen_1.windowWhen;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/withLatestFrom", ["rxjs/Observable", "rxjs/operator/withLatestFrom"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var withLatestFrom_1 = require("rxjs/operator/withLatestFrom");
  Observable_1.Observable.prototype.withLatestFrom = withLatestFrom_1.withLatestFrom;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/zipAll", ["rxjs/Observable", "rxjs/operator/zipAll"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var zipAll_1 = require("rxjs/operator/zipAll");
  Observable_1.Observable.prototype.zipAll = zipAll_1.zipAll;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/Subscription", ["rxjs/util/isArray", "rxjs/util/isObject", "rxjs/util/isFunction", "rxjs/util/tryCatch", "rxjs/util/errorObject", "rxjs/util/UnsubscriptionError"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var isArray_1 = require("rxjs/util/isArray");
  var isObject_1 = require("rxjs/util/isObject");
  var isFunction_1 = require("rxjs/util/isFunction");
  var tryCatch_1 = require("rxjs/util/tryCatch");
  var errorObject_1 = require("rxjs/util/errorObject");
  var UnsubscriptionError_1 = require("rxjs/util/UnsubscriptionError");
  var Subscription = (function() {
    function Subscription(unsubscribe) {
      this.isUnsubscribed = false;
      if (unsubscribe) {
        this._unsubscribe = unsubscribe;
      }
    }
    Subscription.prototype.unsubscribe = function() {
      var hasErrors = false;
      var errors;
      if (this.isUnsubscribed) {
        return ;
      }
      this.isUnsubscribed = true;
      var _a = this,
          _unsubscribe = _a._unsubscribe,
          _subscriptions = _a._subscriptions;
      this._subscriptions = null;
      if (isFunction_1.isFunction(_unsubscribe)) {
        var trial = tryCatch_1.tryCatch(_unsubscribe).call(this);
        if (trial === errorObject_1.errorObject) {
          hasErrors = true;
          (errors = errors || []).push(errorObject_1.errorObject.e);
        }
      }
      if (isArray_1.isArray(_subscriptions)) {
        var index = -1;
        var len = _subscriptions.length;
        while (++index < len) {
          var sub = _subscriptions[index];
          if (isObject_1.isObject(sub)) {
            var trial = tryCatch_1.tryCatch(sub.unsubscribe).call(sub);
            if (trial === errorObject_1.errorObject) {
              hasErrors = true;
              errors = errors || [];
              var err = errorObject_1.errorObject.e;
              if (err instanceof UnsubscriptionError_1.UnsubscriptionError) {
                errors = errors.concat(err.errors);
              } else {
                errors.push(err);
              }
            }
          }
        }
      }
      if (hasErrors) {
        throw new UnsubscriptionError_1.UnsubscriptionError(errors);
      }
    };
    Subscription.prototype.add = function(teardown) {
      if (!teardown || (teardown === this) || (teardown === Subscription.EMPTY)) {
        return ;
      }
      var sub = teardown;
      switch (typeof teardown) {
        case 'function':
          sub = new Subscription(teardown);
        case 'object':
          if (sub.isUnsubscribed || typeof sub.unsubscribe !== 'function') {
            break;
          } else if (this.isUnsubscribed) {
            sub.unsubscribe();
          } else {
            (this._subscriptions || (this._subscriptions = [])).push(sub);
          }
          break;
        default:
          throw new Error('Unrecognized teardown ' + teardown + ' added to Subscription.');
      }
      return sub;
    };
    Subscription.prototype.remove = function(subscription) {
      if (subscription == null || (subscription === this) || (subscription === Subscription.EMPTY)) {
        return ;
      }
      var subscriptions = this._subscriptions;
      if (subscriptions) {
        var subscriptionIndex = subscriptions.indexOf(subscription);
        if (subscriptionIndex !== -1) {
          subscriptions.splice(subscriptionIndex, 1);
        }
      }
    };
    Subscription.EMPTY = (function(empty) {
      empty.isUnsubscribed = true;
      return empty;
    }(new Subscription()));
    return Subscription;
  }());
  exports.Subscription = Subscription;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/bindCallback", ["rxjs/observable/BoundCallbackObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var BoundCallbackObservable_1 = require("rxjs/observable/BoundCallbackObservable");
  exports.bindCallback = BoundCallbackObservable_1.BoundCallbackObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/bindNodeCallback", ["rxjs/Observable", "rxjs/observable/bindNodeCallback"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var bindNodeCallback_1 = require("rxjs/observable/bindNodeCallback");
  Observable_1.Observable.bindNodeCallback = bindNodeCallback_1.bindNodeCallback;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/combineLatest", ["rxjs/observable/ArrayObservable", "rxjs/util/isArray", "rxjs/util/isScheduler", "rxjs/OuterSubscriber", "rxjs/util/subscribeToResult"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var ArrayObservable_1 = require("rxjs/observable/ArrayObservable");
  var isArray_1 = require("rxjs/util/isArray");
  var isScheduler_1 = require("rxjs/util/isScheduler");
  var OuterSubscriber_1 = require("rxjs/OuterSubscriber");
  var subscribeToResult_1 = require("rxjs/util/subscribeToResult");
  function combineLatest() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      observables[_i - 0] = arguments[_i];
    }
    var project = null;
    if (typeof observables[observables.length - 1] === 'function') {
      project = observables.pop();
    }
    if (observables.length === 1 && isArray_1.isArray(observables[0])) {
      observables = observables[0];
    }
    observables.unshift(this);
    return new ArrayObservable_1.ArrayObservable(observables).lift(new CombineLatestOperator(project));
  }
  exports.combineLatest = combineLatest;
  function combineLatestStatic() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      observables[_i - 0] = arguments[_i];
    }
    var project = null;
    var scheduler = null;
    if (isScheduler_1.isScheduler(observables[observables.length - 1])) {
      scheduler = observables.pop();
    }
    if (typeof observables[observables.length - 1] === 'function') {
      project = observables.pop();
    }
    if (observables.length === 1 && isArray_1.isArray(observables[0])) {
      observables = observables[0];
    }
    return new ArrayObservable_1.ArrayObservable(observables, scheduler).lift(new CombineLatestOperator(project));
  }
  exports.combineLatestStatic = combineLatestStatic;
  var CombineLatestOperator = (function() {
    function CombineLatestOperator(project) {
      this.project = project;
    }
    CombineLatestOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new CombineLatestSubscriber(subscriber, this.project));
    };
    return CombineLatestOperator;
  }());
  exports.CombineLatestOperator = CombineLatestOperator;
  var CombineLatestSubscriber = (function(_super) {
    __extends(CombineLatestSubscriber, _super);
    function CombineLatestSubscriber(destination, project) {
      _super.call(this, destination);
      this.project = project;
      this.active = 0;
      this.values = [];
      this.observables = [];
      this.toRespond = [];
    }
    CombineLatestSubscriber.prototype._next = function(observable) {
      var toRespond = this.toRespond;
      toRespond.push(toRespond.length);
      this.observables.push(observable);
    };
    CombineLatestSubscriber.prototype._complete = function() {
      var observables = this.observables;
      var len = observables.length;
      if (len === 0) {
        this.destination.complete();
      } else {
        this.active = len;
        for (var i = 0; i < len; i++) {
          var observable = observables[i];
          this.add(subscribeToResult_1.subscribeToResult(this, observable, observable, i));
        }
      }
    };
    CombineLatestSubscriber.prototype.notifyComplete = function(unused) {
      if ((this.active -= 1) === 0) {
        this.destination.complete();
      }
    };
    CombineLatestSubscriber.prototype.notifyNext = function(outerValue, innerValue, outerIndex, innerIndex, innerSub) {
      var values = this.values;
      values[outerIndex] = innerValue;
      var toRespond = this.toRespond;
      if (toRespond.length > 0) {
        var found = toRespond.indexOf(outerIndex);
        if (found !== -1) {
          toRespond.splice(found, 1);
        }
      }
      if (toRespond.length === 0) {
        if (this.project) {
          this._tryProject(values);
        } else {
          this.destination.next(values);
        }
      }
    };
    CombineLatestSubscriber.prototype._tryProject = function(values) {
      var result;
      try {
        result = this.project.apply(this, values);
      } catch (err) {
        this.destination.error(err);
        return ;
      }
      this.destination.next(result);
    };
    return CombineLatestSubscriber;
  }(OuterSubscriber_1.OuterSubscriber));
  exports.CombineLatestSubscriber = CombineLatestSubscriber;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/concat", ["rxjs/operator/concat"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var concat_1 = require("rxjs/operator/concat");
  exports.concat = concat_1.concatStatic;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/defer", ["rxjs/Observable", "rxjs/observable/defer"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var defer_1 = require("rxjs/observable/defer");
  Observable_1.Observable.defer = defer_1.defer;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/forkJoin", ["rxjs/Observable", "rxjs/observable/forkJoin"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var forkJoin_1 = require("rxjs/observable/forkJoin");
  Observable_1.Observable.forkJoin = forkJoin_1.forkJoin;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/FromObservable", ["rxjs/util/isArray", "rxjs/util/isFunction", "rxjs/util/isPromise", "rxjs/util/isScheduler", "rxjs/observable/PromiseObservable", "rxjs/observable/IteratorObservable", "rxjs/observable/ArrayObservable", "rxjs/observable/ArrayLikeObservable", "rxjs/symbol/observable", "rxjs/symbol/iterator", "rxjs/Observable", "rxjs/operator/observeOn"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var isArray_1 = require("rxjs/util/isArray");
  var isFunction_1 = require("rxjs/util/isFunction");
  var isPromise_1 = require("rxjs/util/isPromise");
  var isScheduler_1 = require("rxjs/util/isScheduler");
  var PromiseObservable_1 = require("rxjs/observable/PromiseObservable");
  var IteratorObservable_1 = require("rxjs/observable/IteratorObservable");
  var ArrayObservable_1 = require("rxjs/observable/ArrayObservable");
  var ArrayLikeObservable_1 = require("rxjs/observable/ArrayLikeObservable");
  var observable_1 = require("rxjs/symbol/observable");
  var iterator_1 = require("rxjs/symbol/iterator");
  var Observable_1 = require("rxjs/Observable");
  var observeOn_1 = require("rxjs/operator/observeOn");
  var isArrayLike = (function(x) {
    return x && typeof x.length === 'number';
  });
  var FromObservable = (function(_super) {
    __extends(FromObservable, _super);
    function FromObservable(ish, scheduler) {
      _super.call(this, null);
      this.ish = ish;
      this.scheduler = scheduler;
    }
    FromObservable.create = function(ish, mapFnOrScheduler, thisArg, lastScheduler) {
      var scheduler = null;
      var mapFn = null;
      if (isFunction_1.isFunction(mapFnOrScheduler)) {
        scheduler = lastScheduler || null;
        mapFn = mapFnOrScheduler;
      } else if (isScheduler_1.isScheduler(scheduler)) {
        scheduler = mapFnOrScheduler;
      }
      if (ish != null) {
        if (typeof ish[observable_1.$$observable] === 'function') {
          if (ish instanceof Observable_1.Observable && !scheduler) {
            return ish;
          }
          return new FromObservable(ish, scheduler);
        } else if (isArray_1.isArray(ish)) {
          return new ArrayObservable_1.ArrayObservable(ish, scheduler);
        } else if (isPromise_1.isPromise(ish)) {
          return new PromiseObservable_1.PromiseObservable(ish, scheduler);
        } else if (typeof ish[iterator_1.$$iterator] === 'function' || typeof ish === 'string') {
          return new IteratorObservable_1.IteratorObservable(ish, null, null, scheduler);
        } else if (isArrayLike(ish)) {
          return new ArrayLikeObservable_1.ArrayLikeObservable(ish, mapFn, thisArg, scheduler);
        }
      }
      throw new TypeError((ish !== null && typeof ish || ish) + ' is not observable');
    };
    FromObservable.prototype._subscribe = function(subscriber) {
      var ish = this.ish;
      var scheduler = this.scheduler;
      if (scheduler == null) {
        return ish[observable_1.$$observable]().subscribe(subscriber);
      } else {
        return ish[observable_1.$$observable]().subscribe(new observeOn_1.ObserveOnSubscriber(subscriber, scheduler, 0));
      }
    };
    return FromObservable;
  }(Observable_1.Observable));
  exports.FromObservable = FromObservable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/fromEvent", ["rxjs/Observable", "rxjs/observable/fromEvent"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var fromEvent_1 = require("rxjs/observable/fromEvent");
  Observable_1.Observable.fromEvent = fromEvent_1.fromEvent;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/fromEventPattern", ["rxjs/Observable", "rxjs/observable/fromEventPattern"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var fromEventPattern_1 = require("rxjs/observable/fromEventPattern");
  Observable_1.Observable.fromEventPattern = fromEventPattern_1.fromEventPattern;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/scheduler/AsyncScheduler", ["rxjs/scheduler/FutureAction", "rxjs/scheduler/QueueScheduler"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var FutureAction_1 = require("rxjs/scheduler/FutureAction");
  var QueueScheduler_1 = require("rxjs/scheduler/QueueScheduler");
  var AsyncScheduler = (function(_super) {
    __extends(AsyncScheduler, _super);
    function AsyncScheduler() {
      _super.apply(this, arguments);
    }
    AsyncScheduler.prototype.scheduleNow = function(work, state) {
      return new FutureAction_1.FutureAction(this, work).schedule(state, 0);
    };
    return AsyncScheduler;
  }(QueueScheduler_1.QueueScheduler));
  exports.AsyncScheduler = AsyncScheduler;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/merge", ["rxjs/Observable", "rxjs/observable/merge"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var merge_1 = require("rxjs/observable/merge");
  Observable_1.Observable.merge = merge_1.merge;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/never", ["rxjs/observable/NeverObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var NeverObservable_1 = require("rxjs/observable/NeverObservable");
  exports.never = NeverObservable_1.NeverObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/range", ["rxjs/Observable", "rxjs/observable/range"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var range_1 = require("rxjs/observable/range");
  Observable_1.Observable.range = range_1.range;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/throw", ["rxjs/Observable", "rxjs/observable/throw"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var throw_1 = require("rxjs/observable/throw");
  Observable_1.Observable.throw = throw_1._throw;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/timer", ["rxjs/observable/TimerObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var TimerObservable_1 = require("rxjs/observable/TimerObservable");
  exports.timer = TimerObservable_1.TimerObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/zip", ["rxjs/Observable", "rxjs/observable/zip"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var zip_1 = require("rxjs/observable/zip");
  Observable_1.Observable.zip = zip_1.zip;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/publishReplay", ["rxjs/ReplaySubject", "rxjs/operator/multicast"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var ReplaySubject_1 = require("rxjs/ReplaySubject");
  var multicast_1 = require("rxjs/operator/multicast");
  function publishReplay(bufferSize, windowTime, scheduler) {
    if (bufferSize === void 0) {
      bufferSize = Number.POSITIVE_INFINITY;
    }
    if (windowTime === void 0) {
      windowTime = Number.POSITIVE_INFINITY;
    }
    return multicast_1.multicast.call(this, new ReplaySubject_1.ReplaySubject(bufferSize, windowTime, scheduler));
  }
  exports.publishReplay = publishReplay;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/concatMap", ["rxjs/Observable", "rxjs/operator/concatMap"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var concatMap_1 = require("rxjs/operator/concatMap");
  Observable_1.Observable.prototype.concatMap = concatMap_1.concatMap;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/concatMapTo", ["rxjs/Observable", "rxjs/operator/concatMapTo"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var concatMapTo_1 = require("rxjs/operator/concatMapTo");
  Observable_1.Observable.prototype.concatMapTo = concatMapTo_1.concatMapTo;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/first", ["rxjs/Observable", "rxjs/operator/first"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var first_1 = require("rxjs/operator/first");
  Observable_1.Observable.prototype.first = first_1.first;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/groupBy", ["rxjs/Subscriber", "rxjs/Subscription", "rxjs/Observable", "rxjs/Subject", "rxjs/util/Map", "rxjs/util/FastMap"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscriber_1 = require("rxjs/Subscriber");
  var Subscription_1 = require("rxjs/Subscription");
  var Observable_1 = require("rxjs/Observable");
  var Subject_1 = require("rxjs/Subject");
  var Map_1 = require("rxjs/util/Map");
  var FastMap_1 = require("rxjs/util/FastMap");
  function groupBy(keySelector, elementSelector, durationSelector) {
    return this.lift(new GroupByOperator(this, keySelector, elementSelector, durationSelector));
  }
  exports.groupBy = groupBy;
  var GroupByOperator = (function() {
    function GroupByOperator(source, keySelector, elementSelector, durationSelector) {
      this.source = source;
      this.keySelector = keySelector;
      this.elementSelector = elementSelector;
      this.durationSelector = durationSelector;
    }
    GroupByOperator.prototype.call = function(subscriber, source) {
      return source._subscribe(new GroupBySubscriber(subscriber, this.keySelector, this.elementSelector, this.durationSelector));
    };
    return GroupByOperator;
  }());
  var GroupBySubscriber = (function(_super) {
    __extends(GroupBySubscriber, _super);
    function GroupBySubscriber(destination, keySelector, elementSelector, durationSelector) {
      _super.call(this);
      this.keySelector = keySelector;
      this.elementSelector = elementSelector;
      this.durationSelector = durationSelector;
      this.groups = null;
      this.attemptedToUnsubscribe = false;
      this.count = 0;
      this.destination = destination;
      this.add(destination);
    }
    GroupBySubscriber.prototype._next = function(value) {
      var key;
      try {
        key = this.keySelector(value);
      } catch (err) {
        this.error(err);
        return ;
      }
      this._group(value, key);
    };
    GroupBySubscriber.prototype._group = function(value, key) {
      var groups = this.groups;
      if (!groups) {
        groups = this.groups = typeof key === 'string' ? new FastMap_1.FastMap() : new Map_1.Map();
      }
      var group = groups.get(key);
      if (!group) {
        groups.set(key, group = new Subject_1.Subject());
        var groupedObservable = new GroupedObservable(key, group, this);
        if (this.durationSelector) {
          this._selectDuration(key, group);
        }
        this.destination.next(groupedObservable);
      }
      if (this.elementSelector) {
        this._selectElement(value, group);
      } else {
        this.tryGroupNext(value, group);
      }
    };
    GroupBySubscriber.prototype._selectElement = function(value, group) {
      var result;
      try {
        result = this.elementSelector(value);
      } catch (err) {
        this.error(err);
        return ;
      }
      this.tryGroupNext(result, group);
    };
    GroupBySubscriber.prototype._selectDuration = function(key, group) {
      var duration;
      try {
        duration = this.durationSelector(new GroupedObservable(key, group));
      } catch (err) {
        this.error(err);
        return ;
      }
      this.add(duration.subscribe(new GroupDurationSubscriber(key, group, this)));
    };
    GroupBySubscriber.prototype.tryGroupNext = function(value, group) {
      if (!group.isUnsubscribed) {
        group.next(value);
      }
    };
    GroupBySubscriber.prototype._error = function(err) {
      var groups = this.groups;
      if (groups) {
        groups.forEach(function(group, key) {
          group.error(err);
        });
        groups.clear();
      }
      this.destination.error(err);
    };
    GroupBySubscriber.prototype._complete = function() {
      var groups = this.groups;
      if (groups) {
        groups.forEach(function(group, key) {
          group.complete();
        });
        groups.clear();
      }
      this.destination.complete();
    };
    GroupBySubscriber.prototype.removeGroup = function(key) {
      this.groups.delete(key);
    };
    GroupBySubscriber.prototype.unsubscribe = function() {
      if (!this.isUnsubscribed && !this.attemptedToUnsubscribe) {
        this.attemptedToUnsubscribe = true;
        if (this.count === 0) {
          _super.prototype.unsubscribe.call(this);
        }
      }
    };
    return GroupBySubscriber;
  }(Subscriber_1.Subscriber));
  var GroupDurationSubscriber = (function(_super) {
    __extends(GroupDurationSubscriber, _super);
    function GroupDurationSubscriber(key, group, parent) {
      _super.call(this);
      this.key = key;
      this.group = group;
      this.parent = parent;
    }
    GroupDurationSubscriber.prototype._next = function(value) {
      this.tryComplete();
    };
    GroupDurationSubscriber.prototype._error = function(err) {
      this.tryError(err);
    };
    GroupDurationSubscriber.prototype._complete = function() {
      this.tryComplete();
    };
    GroupDurationSubscriber.prototype.tryError = function(err) {
      var group = this.group;
      if (!group.isUnsubscribed) {
        group.error(err);
      }
      this.parent.removeGroup(this.key);
    };
    GroupDurationSubscriber.prototype.tryComplete = function() {
      var group = this.group;
      if (!group.isUnsubscribed) {
        group.complete();
      }
      this.parent.removeGroup(this.key);
    };
    return GroupDurationSubscriber;
  }(Subscriber_1.Subscriber));
  var GroupedObservable = (function(_super) {
    __extends(GroupedObservable, _super);
    function GroupedObservable(key, groupSubject, refCountSubscription) {
      _super.call(this);
      this.key = key;
      this.groupSubject = groupSubject;
      this.refCountSubscription = refCountSubscription;
    }
    GroupedObservable.prototype._subscribe = function(subscriber) {
      var subscription = new Subscription_1.Subscription();
      var _a = this,
          refCountSubscription = _a.refCountSubscription,
          groupSubject = _a.groupSubject;
      if (refCountSubscription && !refCountSubscription.isUnsubscribed) {
        subscription.add(new InnerRefCountSubscription(refCountSubscription));
      }
      subscription.add(groupSubject.subscribe(subscriber));
      return subscription;
    };
    return GroupedObservable;
  }(Observable_1.Observable));
  exports.GroupedObservable = GroupedObservable;
  var InnerRefCountSubscription = (function(_super) {
    __extends(InnerRefCountSubscription, _super);
    function InnerRefCountSubscription(parent) {
      _super.call(this);
      this.parent = parent;
      parent.count++;
    }
    InnerRefCountSubscription.prototype.unsubscribe = function() {
      var parent = this.parent;
      if (!parent.isUnsubscribed && !this.isUnsubscribed) {
        _super.prototype.unsubscribe.call(this);
        parent.count -= 1;
        if (parent.count === 0 && parent.attemptedToUnsubscribe) {
          parent.unsubscribe();
        }
      }
    };
    return InnerRefCountSubscription;
  }(Subscription_1.Subscription));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/partition", ["rxjs/Observable", "rxjs/operator/partition"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var partition_1 = require("rxjs/operator/partition");
  Observable_1.Observable.prototype.partition = partition_1.partition;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/publishBehavior", ["rxjs/Observable", "rxjs/operator/publishBehavior"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var publishBehavior_1 = require("rxjs/operator/publishBehavior");
  Observable_1.Observable.prototype.publishBehavior = publishBehavior_1.publishBehavior;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/scheduler/AsapScheduler", ["rxjs/scheduler/AsapAction", "rxjs/scheduler/QueueScheduler"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var AsapAction_1 = require("rxjs/scheduler/AsapAction");
  var QueueScheduler_1 = require("rxjs/scheduler/QueueScheduler");
  var AsapScheduler = (function(_super) {
    __extends(AsapScheduler, _super);
    function AsapScheduler() {
      _super.apply(this, arguments);
    }
    AsapScheduler.prototype.scheduleNow = function(work, state) {
      return new AsapAction_1.AsapAction(this, work).schedule(state);
    };
    return AsapScheduler;
  }(QueueScheduler_1.QueueScheduler));
  exports.AsapScheduler = AsapScheduler;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/take", ["rxjs/Observable", "rxjs/operator/take"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var take_1 = require("rxjs/operator/take");
  Observable_1.Observable.prototype.take = take_1.take;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/Subscriber", ["rxjs/util/isFunction", "rxjs/Subscription", "rxjs/symbol/rxSubscriber", "rxjs/Observer"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var isFunction_1 = require("rxjs/util/isFunction");
  var Subscription_1 = require("rxjs/Subscription");
  var rxSubscriber_1 = require("rxjs/symbol/rxSubscriber");
  var Observer_1 = require("rxjs/Observer");
  var Subscriber = (function(_super) {
    __extends(Subscriber, _super);
    function Subscriber(destinationOrNext, error, complete) {
      _super.call(this);
      this.syncErrorValue = null;
      this.syncErrorThrown = false;
      this.syncErrorThrowable = false;
      this.isStopped = false;
      switch (arguments.length) {
        case 0:
          this.destination = Observer_1.empty;
          break;
        case 1:
          if (!destinationOrNext) {
            this.destination = Observer_1.empty;
            break;
          }
          if (typeof destinationOrNext === 'object') {
            if (destinationOrNext instanceof Subscriber) {
              this.destination = destinationOrNext;
              this.destination.add(this);
            } else {
              this.syncErrorThrowable = true;
              this.destination = new SafeSubscriber(this, destinationOrNext);
            }
            break;
          }
        default:
          this.syncErrorThrowable = true;
          this.destination = new SafeSubscriber(this, destinationOrNext, error, complete);
          break;
      }
    }
    Subscriber.create = function(next, error, complete) {
      var subscriber = new Subscriber(next, error, complete);
      subscriber.syncErrorThrowable = false;
      return subscriber;
    };
    Subscriber.prototype.next = function(value) {
      if (!this.isStopped) {
        this._next(value);
      }
    };
    Subscriber.prototype.error = function(err) {
      if (!this.isStopped) {
        this.isStopped = true;
        this._error(err);
      }
    };
    Subscriber.prototype.complete = function() {
      if (!this.isStopped) {
        this.isStopped = true;
        this._complete();
      }
    };
    Subscriber.prototype.unsubscribe = function() {
      if (this.isUnsubscribed) {
        return ;
      }
      this.isStopped = true;
      _super.prototype.unsubscribe.call(this);
    };
    Subscriber.prototype._next = function(value) {
      this.destination.next(value);
    };
    Subscriber.prototype._error = function(err) {
      this.destination.error(err);
      this.unsubscribe();
    };
    Subscriber.prototype._complete = function() {
      this.destination.complete();
      this.unsubscribe();
    };
    Subscriber.prototype[rxSubscriber_1.$$rxSubscriber] = function() {
      return this;
    };
    return Subscriber;
  }(Subscription_1.Subscription));
  exports.Subscriber = Subscriber;
  var SafeSubscriber = (function(_super) {
    __extends(SafeSubscriber, _super);
    function SafeSubscriber(_parent, observerOrNext, error, complete) {
      _super.call(this);
      this._parent = _parent;
      var next;
      var context = this;
      if (isFunction_1.isFunction(observerOrNext)) {
        next = observerOrNext;
      } else if (observerOrNext) {
        context = observerOrNext;
        next = observerOrNext.next;
        error = observerOrNext.error;
        complete = observerOrNext.complete;
        if (isFunction_1.isFunction(context.unsubscribe)) {
          this.add(context.unsubscribe.bind(context));
        }
        context.unsubscribe = this.unsubscribe.bind(this);
      }
      this._context = context;
      this._next = next;
      this._error = error;
      this._complete = complete;
    }
    SafeSubscriber.prototype.next = function(value) {
      if (!this.isStopped && this._next) {
        var _parent = this._parent;
        if (!_parent.syncErrorThrowable) {
          this.__tryOrUnsub(this._next, value);
        } else if (this.__tryOrSetError(_parent, this._next, value)) {
          this.unsubscribe();
        }
      }
    };
    SafeSubscriber.prototype.error = function(err) {
      if (!this.isStopped) {
        var _parent = this._parent;
        if (this._error) {
          if (!_parent.syncErrorThrowable) {
            this.__tryOrUnsub(this._error, err);
            this.unsubscribe();
          } else {
            this.__tryOrSetError(_parent, this._error, err);
            this.unsubscribe();
          }
        } else if (!_parent.syncErrorThrowable) {
          this.unsubscribe();
          throw err;
        } else {
          _parent.syncErrorValue = err;
          _parent.syncErrorThrown = true;
          this.unsubscribe();
        }
      }
    };
    SafeSubscriber.prototype.complete = function() {
      if (!this.isStopped) {
        var _parent = this._parent;
        if (this._complete) {
          if (!_parent.syncErrorThrowable) {
            this.__tryOrUnsub(this._complete);
            this.unsubscribe();
          } else {
            this.__tryOrSetError(_parent, this._complete);
            this.unsubscribe();
          }
        } else {
          this.unsubscribe();
        }
      }
    };
    SafeSubscriber.prototype.__tryOrUnsub = function(fn, value) {
      try {
        fn.call(this._context, value);
      } catch (err) {
        this.unsubscribe();
        throw err;
      }
    };
    SafeSubscriber.prototype.__tryOrSetError = function(parent, fn, value) {
      try {
        fn.call(this._context, value);
      } catch (err) {
        parent.syncErrorValue = err;
        parent.syncErrorThrown = true;
        return true;
      }
      return false;
    };
    SafeSubscriber.prototype._unsubscribe = function() {
      var _parent = this._parent;
      this._context = null;
      this._parent = null;
      _parent.unsubscribe();
    };
    return SafeSubscriber;
  }(Subscriber));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/bindCallback", ["rxjs/Observable", "rxjs/observable/bindCallback"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var bindCallback_1 = require("rxjs/observable/bindCallback");
  Observable_1.Observable.bindCallback = bindCallback_1.bindCallback;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/combineLatest", ["rxjs/Observable", "rxjs/operator/combineLatest"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var combineLatest_1 = require("rxjs/operator/combineLatest");
  Observable_1.Observable.combineLatest = combineLatest_1.combineLatestStatic;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/concat", ["rxjs/Observable", "rxjs/observable/concat"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var concat_1 = require("rxjs/observable/concat");
  Observable_1.Observable.concat = concat_1.concat;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/from", ["rxjs/observable/FromObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var FromObservable_1 = require("rxjs/observable/FromObservable");
  exports.from = FromObservable_1.FromObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/scheduler/async", ["rxjs/scheduler/AsyncScheduler"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var AsyncScheduler_1 = require("rxjs/scheduler/AsyncScheduler");
  exports.async = new AsyncScheduler_1.AsyncScheduler();
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/never", ["rxjs/Observable", "rxjs/observable/never"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var never_1 = require("rxjs/observable/never");
  Observable_1.Observable.never = never_1.never;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/timer", ["rxjs/Observable", "rxjs/observable/timer"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var timer_1 = require("rxjs/observable/timer");
  Observable_1.Observable.timer = timer_1.timer;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/cache", ["rxjs/operator/publishReplay"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var publishReplay_1 = require("rxjs/operator/publishReplay");
  function cache(bufferSize, windowTime, scheduler) {
    if (bufferSize === void 0) {
      bufferSize = Number.POSITIVE_INFINITY;
    }
    if (windowTime === void 0) {
      windowTime = Number.POSITIVE_INFINITY;
    }
    return publishReplay_1.publishReplay.call(this, bufferSize, windowTime, scheduler).refCount();
  }
  exports.cache = cache;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/groupBy", ["rxjs/Observable", "rxjs/operator/groupBy"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var groupBy_1 = require("rxjs/operator/groupBy");
  Observable_1.Observable.prototype.groupBy = groupBy_1.groupBy;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/scheduler/asap", ["rxjs/scheduler/AsapScheduler"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var AsapScheduler_1 = require("rxjs/scheduler/AsapScheduler");
  exports.asap = new AsapScheduler_1.AsapScheduler();
  global.define = __define;
  return module.exports;
});

System.register("rxjs/util/toSubscriber", ["rxjs/Subscriber", "rxjs/symbol/rxSubscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Subscriber_1 = require("rxjs/Subscriber");
  var rxSubscriber_1 = require("rxjs/symbol/rxSubscriber");
  function toSubscriber(nextOrObserver, error, complete) {
    if (nextOrObserver && typeof nextOrObserver === 'object') {
      if (nextOrObserver instanceof Subscriber_1.Subscriber) {
        return nextOrObserver;
      } else if (typeof nextOrObserver[rxSubscriber_1.$$rxSubscriber] === 'function') {
        return nextOrObserver[rxSubscriber_1.$$rxSubscriber]();
      }
    }
    return new Subscriber_1.Subscriber(nextOrObserver, error, complete);
  }
  exports.toSubscriber = toSubscriber;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/from", ["rxjs/Observable", "rxjs/observable/from"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var from_1 = require("rxjs/observable/from");
  Observable_1.Observable.from = from_1.from;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/IntervalObservable", ["rxjs/util/isNumeric", "rxjs/Observable", "rxjs/scheduler/async"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var isNumeric_1 = require("rxjs/util/isNumeric");
  var Observable_1 = require("rxjs/Observable");
  var async_1 = require("rxjs/scheduler/async");
  var IntervalObservable = (function(_super) {
    __extends(IntervalObservable, _super);
    function IntervalObservable(period, scheduler) {
      if (period === void 0) {
        period = 0;
      }
      if (scheduler === void 0) {
        scheduler = async_1.async;
      }
      _super.call(this);
      this.period = period;
      this.scheduler = scheduler;
      if (!isNumeric_1.isNumeric(period) || period < 0) {
        this.period = 0;
      }
      if (!scheduler || typeof scheduler.schedule !== 'function') {
        this.scheduler = async_1.async;
      }
    }
    IntervalObservable.create = function(period, scheduler) {
      if (period === void 0) {
        period = 0;
      }
      if (scheduler === void 0) {
        scheduler = async_1.async;
      }
      return new IntervalObservable(period, scheduler);
    };
    IntervalObservable.dispatch = function(state) {
      var index = state.index,
          subscriber = state.subscriber,
          period = state.period;
      subscriber.next(index);
      if (subscriber.isUnsubscribed) {
        return ;
      }
      state.index += 1;
      this.schedule(state, period);
    };
    IntervalObservable.prototype._subscribe = function(subscriber) {
      var index = 0;
      var period = this.period;
      var scheduler = this.scheduler;
      subscriber.add(scheduler.schedule(IntervalObservable.dispatch, period, {
        index: index,
        subscriber: subscriber,
        period: period
      }));
    };
    return IntervalObservable;
  }(Observable_1.Observable));
  exports.IntervalObservable = IntervalObservable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/cache", ["rxjs/Observable", "rxjs/operator/cache"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var cache_1 = require("rxjs/operator/cache");
  Observable_1.Observable.prototype.cache = cache_1.cache;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/SubscribeOnObservable", ["rxjs/Observable", "rxjs/scheduler/asap", "rxjs/util/isNumeric"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var asap_1 = require("rxjs/scheduler/asap");
  var isNumeric_1 = require("rxjs/util/isNumeric");
  var SubscribeOnObservable = (function(_super) {
    __extends(SubscribeOnObservable, _super);
    function SubscribeOnObservable(source, delayTime, scheduler) {
      if (delayTime === void 0) {
        delayTime = 0;
      }
      if (scheduler === void 0) {
        scheduler = asap_1.asap;
      }
      _super.call(this);
      this.source = source;
      this.delayTime = delayTime;
      this.scheduler = scheduler;
      if (!isNumeric_1.isNumeric(delayTime) || delayTime < 0) {
        this.delayTime = 0;
      }
      if (!scheduler || typeof scheduler.schedule !== 'function') {
        this.scheduler = asap_1.asap;
      }
    }
    SubscribeOnObservable.create = function(source, delay, scheduler) {
      if (delay === void 0) {
        delay = 0;
      }
      if (scheduler === void 0) {
        scheduler = asap_1.asap;
      }
      return new SubscribeOnObservable(source, delay, scheduler);
    };
    SubscribeOnObservable.dispatch = function(arg) {
      var source = arg.source,
          subscriber = arg.subscriber;
      return source.subscribe(subscriber);
    };
    SubscribeOnObservable.prototype._subscribe = function(subscriber) {
      var delay = this.delayTime;
      var source = this.source;
      var scheduler = this.scheduler;
      return scheduler.schedule(SubscribeOnObservable.dispatch, delay, {
        source: source,
        subscriber: subscriber
      });
    };
    return SubscribeOnObservable;
  }(Observable_1.Observable));
  exports.SubscribeOnObservable = SubscribeOnObservable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/Observable", ["rxjs/util/root", "rxjs/symbol/observable", "rxjs/util/toSubscriber"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var root_1 = require("rxjs/util/root");
  var observable_1 = require("rxjs/symbol/observable");
  var toSubscriber_1 = require("rxjs/util/toSubscriber");
  var Observable = (function() {
    function Observable(subscribe) {
      this._isScalar = false;
      if (subscribe) {
        this._subscribe = subscribe;
      }
    }
    Observable.prototype.lift = function(operator) {
      var observable = new Observable();
      observable.source = this;
      observable.operator = operator;
      return observable;
    };
    Observable.prototype.subscribe = function(observerOrNext, error, complete) {
      var operator = this.operator;
      var sink = toSubscriber_1.toSubscriber(observerOrNext, error, complete);
      sink.add(operator ? operator.call(sink, this) : this._subscribe(sink));
      if (sink.syncErrorThrowable) {
        sink.syncErrorThrowable = false;
        if (sink.syncErrorThrown) {
          throw sink.syncErrorValue;
        }
      }
      return sink;
    };
    Observable.prototype.forEach = function(next, PromiseCtor) {
      var _this = this;
      if (!PromiseCtor) {
        if (root_1.root.Rx && root_1.root.Rx.config && root_1.root.Rx.config.Promise) {
          PromiseCtor = root_1.root.Rx.config.Promise;
        } else if (root_1.root.Promise) {
          PromiseCtor = root_1.root.Promise;
        }
      }
      if (!PromiseCtor) {
        throw new Error('no Promise impl found');
      }
      return new PromiseCtor(function(resolve, reject) {
        var subscription = _this.subscribe(function(value) {
          if (subscription) {
            try {
              next(value);
            } catch (err) {
              reject(err);
              subscription.unsubscribe();
            }
          } else {
            next(value);
          }
        }, reject, resolve);
      });
    };
    Observable.prototype._subscribe = function(subscriber) {
      return this.source.subscribe(subscriber);
    };
    Observable.prototype[observable_1.$$observable] = function() {
      return this;
    };
    Observable.create = function(subscribe) {
      return new Observable(subscribe);
    };
    return Observable;
  }());
  exports.Observable = Observable;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/observable/interval", ["rxjs/observable/IntervalObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var IntervalObservable_1 = require("rxjs/observable/IntervalObservable");
  exports.interval = IntervalObservable_1.IntervalObservable.create;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/operator/subscribeOn", ["rxjs/observable/SubscribeOnObservable"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var SubscribeOnObservable_1 = require("rxjs/observable/SubscribeOnObservable");
  function subscribeOn(scheduler, delay) {
    if (delay === void 0) {
      delay = 0;
    }
    return new SubscribeOnObservable_1.SubscribeOnObservable(this, delay, scheduler);
  }
  exports.subscribeOn = subscribeOn;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/Subject", ["rxjs/Observable", "rxjs/Subscriber", "rxjs/Subscription", "rxjs/SubjectSubscription", "rxjs/symbol/rxSubscriber", "rxjs/util/throwError", "rxjs/util/ObjectUnsubscribedError"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = require("rxjs/Observable");
  var Subscriber_1 = require("rxjs/Subscriber");
  var Subscription_1 = require("rxjs/Subscription");
  var SubjectSubscription_1 = require("rxjs/SubjectSubscription");
  var rxSubscriber_1 = require("rxjs/symbol/rxSubscriber");
  var throwError_1 = require("rxjs/util/throwError");
  var ObjectUnsubscribedError_1 = require("rxjs/util/ObjectUnsubscribedError");
  var Subject = (function(_super) {
    __extends(Subject, _super);
    function Subject(destination, source) {
      _super.call(this);
      this.destination = destination;
      this.source = source;
      this.observers = [];
      this.isUnsubscribed = false;
      this.isStopped = false;
      this.hasErrored = false;
      this.dispatching = false;
      this.hasCompleted = false;
      this.source = source;
    }
    Subject.prototype.lift = function(operator) {
      var subject = new Subject(this.destination || this, this);
      subject.operator = operator;
      return subject;
    };
    Subject.prototype.add = function(subscription) {
      return Subscription_1.Subscription.prototype.add.call(this, subscription);
    };
    Subject.prototype.remove = function(subscription) {
      Subscription_1.Subscription.prototype.remove.call(this, subscription);
    };
    Subject.prototype.unsubscribe = function() {
      Subscription_1.Subscription.prototype.unsubscribe.call(this);
    };
    Subject.prototype._subscribe = function(subscriber) {
      if (this.source) {
        return this.source.subscribe(subscriber);
      } else {
        if (subscriber.isUnsubscribed) {
          return ;
        } else if (this.hasErrored) {
          return subscriber.error(this.errorValue);
        } else if (this.hasCompleted) {
          return subscriber.complete();
        }
        this.throwIfUnsubscribed();
        var subscription = new SubjectSubscription_1.SubjectSubscription(this, subscriber);
        this.observers.push(subscriber);
        return subscription;
      }
    };
    Subject.prototype._unsubscribe = function() {
      this.source = null;
      this.isStopped = true;
      this.observers = null;
      this.destination = null;
    };
    Subject.prototype.next = function(value) {
      this.throwIfUnsubscribed();
      if (this.isStopped) {
        return ;
      }
      this.dispatching = true;
      this._next(value);
      this.dispatching = false;
      if (this.hasErrored) {
        this._error(this.errorValue);
      } else if (this.hasCompleted) {
        this._complete();
      }
    };
    Subject.prototype.error = function(err) {
      this.throwIfUnsubscribed();
      if (this.isStopped) {
        return ;
      }
      this.isStopped = true;
      this.hasErrored = true;
      this.errorValue = err;
      if (this.dispatching) {
        return ;
      }
      this._error(err);
    };
    Subject.prototype.complete = function() {
      this.throwIfUnsubscribed();
      if (this.isStopped) {
        return ;
      }
      this.isStopped = true;
      this.hasCompleted = true;
      if (this.dispatching) {
        return ;
      }
      this._complete();
    };
    Subject.prototype.asObservable = function() {
      var observable = new SubjectObservable(this);
      return observable;
    };
    Subject.prototype._next = function(value) {
      if (this.destination) {
        this.destination.next(value);
      } else {
        this._finalNext(value);
      }
    };
    Subject.prototype._finalNext = function(value) {
      var index = -1;
      var observers = this.observers.slice(0);
      var len = observers.length;
      while (++index < len) {
        observers[index].next(value);
      }
    };
    Subject.prototype._error = function(err) {
      if (this.destination) {
        this.destination.error(err);
      } else {
        this._finalError(err);
      }
    };
    Subject.prototype._finalError = function(err) {
      var index = -1;
      var observers = this.observers;
      this.observers = null;
      this.isUnsubscribed = true;
      if (observers) {
        var len = observers.length;
        while (++index < len) {
          observers[index].error(err);
        }
      }
      this.isUnsubscribed = false;
      this.unsubscribe();
    };
    Subject.prototype._complete = function() {
      if (this.destination) {
        this.destination.complete();
      } else {
        this._finalComplete();
      }
    };
    Subject.prototype._finalComplete = function() {
      var index = -1;
      var observers = this.observers;
      this.observers = null;
      this.isUnsubscribed = true;
      if (observers) {
        var len = observers.length;
        while (++index < len) {
          observers[index].complete();
        }
      }
      this.isUnsubscribed = false;
      this.unsubscribe();
    };
    Subject.prototype.throwIfUnsubscribed = function() {
      if (this.isUnsubscribed) {
        throwError_1.throwError(new ObjectUnsubscribedError_1.ObjectUnsubscribedError());
      }
    };
    Subject.prototype[rxSubscriber_1.$$rxSubscriber] = function() {
      return new Subscriber_1.Subscriber(this);
    };
    Subject.create = function(destination, source) {
      return new Subject(destination, source);
    };
    return Subject;
  }(Observable_1.Observable));
  exports.Subject = Subject;
  var SubjectObservable = (function(_super) {
    __extends(SubjectObservable, _super);
    function SubjectObservable(source) {
      _super.call(this);
      this.source = source;
    }
    return SubjectObservable;
  }(Observable_1.Observable));
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/observable/interval", ["rxjs/Observable", "rxjs/observable/interval"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var interval_1 = require("rxjs/observable/interval");
  Observable_1.Observable.interval = interval_1.interval;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/add/operator/subscribeOn", ["rxjs/Observable", "rxjs/operator/subscribeOn"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Observable_1 = require("rxjs/Observable");
  var subscribeOn_1 = require("rxjs/operator/subscribeOn");
  Observable_1.Observable.prototype.subscribeOn = subscribeOn_1.subscribeOn;
  global.define = __define;
  return module.exports;
});

System.register("rxjs/Rx", ["rxjs/Subject", "rxjs/Observable", "rxjs/add/observable/bindCallback", "rxjs/add/observable/bindNodeCallback", "rxjs/add/observable/combineLatest", "rxjs/add/observable/concat", "rxjs/add/observable/defer", "rxjs/add/observable/empty", "rxjs/add/observable/forkJoin", "rxjs/add/observable/from", "rxjs/add/observable/fromEvent", "rxjs/add/observable/fromEventPattern", "rxjs/add/observable/fromPromise", "rxjs/add/observable/interval", "rxjs/add/observable/merge", "rxjs/add/observable/race", "rxjs/add/observable/never", "rxjs/add/observable/of", "rxjs/add/observable/range", "rxjs/add/observable/throw", "rxjs/add/observable/timer", "rxjs/add/observable/zip", "rxjs/add/operator/buffer", "rxjs/add/operator/bufferCount", "rxjs/add/operator/bufferTime", "rxjs/add/operator/bufferToggle", "rxjs/add/operator/bufferWhen", "rxjs/add/operator/cache", "rxjs/add/operator/catch", "rxjs/add/operator/combineAll", "rxjs/add/operator/combineLatest", "rxjs/add/operator/concat", "rxjs/add/operator/concatAll", "rxjs/add/operator/concatMap", "rxjs/add/operator/concatMapTo", "rxjs/add/operator/count", "rxjs/add/operator/dematerialize", "rxjs/add/operator/debounce", "rxjs/add/operator/debounceTime", "rxjs/add/operator/defaultIfEmpty", "rxjs/add/operator/delay", "rxjs/add/operator/delayWhen", "rxjs/add/operator/distinctUntilChanged", "rxjs/add/operator/do", "rxjs/add/operator/expand", "rxjs/add/operator/filter", "rxjs/add/operator/finally", "rxjs/add/operator/first", "rxjs/add/operator/groupBy", "rxjs/add/operator/ignoreElements", "rxjs/add/operator/audit", "rxjs/add/operator/auditTime", "rxjs/add/operator/last", "rxjs/add/operator/let", "rxjs/add/operator/every", "rxjs/add/operator/map", "rxjs/add/operator/mapTo", "rxjs/add/operator/materialize", "rxjs/add/operator/merge", "rxjs/add/operator/mergeAll", "rxjs/add/operator/mergeMap", "rxjs/add/operator/mergeMapTo", "rxjs/add/operator/multicast", "rxjs/add/operator/observeOn", "rxjs/add/operator/partition", "rxjs/add/operator/pluck", "rxjs/add/operator/publish", "rxjs/add/operator/publishBehavior", "rxjs/add/operator/publishReplay", "rxjs/add/operator/publishLast", "rxjs/add/operator/race", "rxjs/add/operator/reduce", "rxjs/add/operator/repeat", "rxjs/add/operator/retry", "rxjs/add/operator/retryWhen", "rxjs/add/operator/sample", "rxjs/add/operator/sampleTime", "rxjs/add/operator/scan", "rxjs/add/operator/share", "rxjs/add/operator/single", "rxjs/add/operator/skip", "rxjs/add/operator/skipUntil", "rxjs/add/operator/skipWhile", "rxjs/add/operator/startWith", "rxjs/add/operator/subscribeOn", "rxjs/add/operator/switch", "rxjs/add/operator/switchMap", "rxjs/add/operator/switchMapTo", "rxjs/add/operator/take", "rxjs/add/operator/takeLast", "rxjs/add/operator/takeUntil", "rxjs/add/operator/takeWhile", "rxjs/add/operator/throttle", "rxjs/add/operator/throttleTime", "rxjs/add/operator/timeout", "rxjs/add/operator/timeoutWith", "rxjs/add/operator/toArray", "rxjs/add/operator/toPromise", "rxjs/add/operator/window", "rxjs/add/operator/windowCount", "rxjs/add/operator/windowTime", "rxjs/add/operator/windowToggle", "rxjs/add/operator/windowWhen", "rxjs/add/operator/withLatestFrom", "rxjs/add/operator/zip", "rxjs/add/operator/zipAll", "rxjs/Operator", "rxjs/Subscription", "rxjs/Subscriber", "rxjs/AsyncSubject", "rxjs/ReplaySubject", "rxjs/BehaviorSubject", "rxjs/observable/ConnectableObservable", "rxjs/Notification", "rxjs/util/EmptyError", "rxjs/util/ArgumentOutOfRangeError", "rxjs/util/ObjectUnsubscribedError", "rxjs/util/UnsubscriptionError", "rxjs/scheduler/asap", "rxjs/scheduler/async", "rxjs/scheduler/queue", "rxjs/symbol/rxSubscriber", "rxjs/symbol/observable", "rxjs/symbol/iterator"], true, function(require, exports, module) {
  var global = System.global,
      __define = global.define;
  global.define = undefined;
  "use strict";
  var Subject_1 = require("rxjs/Subject");
  exports.Subject = Subject_1.Subject;
  var Observable_1 = require("rxjs/Observable");
  exports.Observable = Observable_1.Observable;
  require("rxjs/add/observable/bindCallback");
  require("rxjs/add/observable/bindNodeCallback");
  require("rxjs/add/observable/combineLatest");
  require("rxjs/add/observable/concat");
  require("rxjs/add/observable/defer");
  require("rxjs/add/observable/empty");
  require("rxjs/add/observable/forkJoin");
  require("rxjs/add/observable/from");
  require("rxjs/add/observable/fromEvent");
  require("rxjs/add/observable/fromEventPattern");
  require("rxjs/add/observable/fromPromise");
  require("rxjs/add/observable/interval");
  require("rxjs/add/observable/merge");
  require("rxjs/add/observable/race");
  require("rxjs/add/observable/never");
  require("rxjs/add/observable/of");
  require("rxjs/add/observable/range");
  require("rxjs/add/observable/throw");
  require("rxjs/add/observable/timer");
  require("rxjs/add/observable/zip");
  require("rxjs/add/operator/buffer");
  require("rxjs/add/operator/bufferCount");
  require("rxjs/add/operator/bufferTime");
  require("rxjs/add/operator/bufferToggle");
  require("rxjs/add/operator/bufferWhen");
  require("rxjs/add/operator/cache");
  require("rxjs/add/operator/catch");
  require("rxjs/add/operator/combineAll");
  require("rxjs/add/operator/combineLatest");
  require("rxjs/add/operator/concat");
  require("rxjs/add/operator/concatAll");
  require("rxjs/add/operator/concatMap");
  require("rxjs/add/operator/concatMapTo");
  require("rxjs/add/operator/count");
  require("rxjs/add/operator/dematerialize");
  require("rxjs/add/operator/debounce");
  require("rxjs/add/operator/debounceTime");
  require("rxjs/add/operator/defaultIfEmpty");
  require("rxjs/add/operator/delay");
  require("rxjs/add/operator/delayWhen");
  require("rxjs/add/operator/distinctUntilChanged");
  require("rxjs/add/operator/do");
  require("rxjs/add/operator/expand");
  require("rxjs/add/operator/filter");
  require("rxjs/add/operator/finally");
  require("rxjs/add/operator/first");
  require("rxjs/add/operator/groupBy");
  require("rxjs/add/operator/ignoreElements");
  require("rxjs/add/operator/audit");
  require("rxjs/add/operator/auditTime");
  require("rxjs/add/operator/last");
  require("rxjs/add/operator/let");
  require("rxjs/add/operator/every");
  require("rxjs/add/operator/map");
  require("rxjs/add/operator/mapTo");
  require("rxjs/add/operator/materialize");
  require("rxjs/add/operator/merge");
  require("rxjs/add/operator/mergeAll");
  require("rxjs/add/operator/mergeMap");
  require("rxjs/add/operator/mergeMapTo");
  require("rxjs/add/operator/multicast");
  require("rxjs/add/operator/observeOn");
  require("rxjs/add/operator/partition");
  require("rxjs/add/operator/pluck");
  require("rxjs/add/operator/publish");
  require("rxjs/add/operator/publishBehavior");
  require("rxjs/add/operator/publishReplay");
  require("rxjs/add/operator/publishLast");
  require("rxjs/add/operator/race");
  require("rxjs/add/operator/reduce");
  require("rxjs/add/operator/repeat");
  require("rxjs/add/operator/retry");
  require("rxjs/add/operator/retryWhen");
  require("rxjs/add/operator/sample");
  require("rxjs/add/operator/sampleTime");
  require("rxjs/add/operator/scan");
  require("rxjs/add/operator/share");
  require("rxjs/add/operator/single");
  require("rxjs/add/operator/skip");
  require("rxjs/add/operator/skipUntil");
  require("rxjs/add/operator/skipWhile");
  require("rxjs/add/operator/startWith");
  require("rxjs/add/operator/subscribeOn");
  require("rxjs/add/operator/switch");
  require("rxjs/add/operator/switchMap");
  require("rxjs/add/operator/switchMapTo");
  require("rxjs/add/operator/take");
  require("rxjs/add/operator/takeLast");
  require("rxjs/add/operator/takeUntil");
  require("rxjs/add/operator/takeWhile");
  require("rxjs/add/operator/throttle");
  require("rxjs/add/operator/throttleTime");
  require("rxjs/add/operator/timeout");
  require("rxjs/add/operator/timeoutWith");
  require("rxjs/add/operator/toArray");
  require("rxjs/add/operator/toPromise");
  require("rxjs/add/operator/window");
  require("rxjs/add/operator/windowCount");
  require("rxjs/add/operator/windowTime");
  require("rxjs/add/operator/windowToggle");
  require("rxjs/add/operator/windowWhen");
  require("rxjs/add/operator/withLatestFrom");
  require("rxjs/add/operator/zip");
  require("rxjs/add/operator/zipAll");
  var Operator_1 = require("rxjs/Operator");
  exports.Operator = Operator_1.Operator;
  var Subscription_1 = require("rxjs/Subscription");
  exports.Subscription = Subscription_1.Subscription;
  var Subscriber_1 = require("rxjs/Subscriber");
  exports.Subscriber = Subscriber_1.Subscriber;
  var AsyncSubject_1 = require("rxjs/AsyncSubject");
  exports.AsyncSubject = AsyncSubject_1.AsyncSubject;
  var ReplaySubject_1 = require("rxjs/ReplaySubject");
  exports.ReplaySubject = ReplaySubject_1.ReplaySubject;
  var BehaviorSubject_1 = require("rxjs/BehaviorSubject");
  exports.BehaviorSubject = BehaviorSubject_1.BehaviorSubject;
  var ConnectableObservable_1 = require("rxjs/observable/ConnectableObservable");
  exports.ConnectableObservable = ConnectableObservable_1.ConnectableObservable;
  var Notification_1 = require("rxjs/Notification");
  exports.Notification = Notification_1.Notification;
  var EmptyError_1 = require("rxjs/util/EmptyError");
  exports.EmptyError = EmptyError_1.EmptyError;
  var ArgumentOutOfRangeError_1 = require("rxjs/util/ArgumentOutOfRangeError");
  exports.ArgumentOutOfRangeError = ArgumentOutOfRangeError_1.ArgumentOutOfRangeError;
  var ObjectUnsubscribedError_1 = require("rxjs/util/ObjectUnsubscribedError");
  exports.ObjectUnsubscribedError = ObjectUnsubscribedError_1.ObjectUnsubscribedError;
  var UnsubscriptionError_1 = require("rxjs/util/UnsubscriptionError");
  exports.UnsubscriptionError = UnsubscriptionError_1.UnsubscriptionError;
  var asap_1 = require("rxjs/scheduler/asap");
  var async_1 = require("rxjs/scheduler/async");
  var queue_1 = require("rxjs/scheduler/queue");
  var rxSubscriber_1 = require("rxjs/symbol/rxSubscriber");
  var observable_1 = require("rxjs/symbol/observable");
  var iterator_1 = require("rxjs/symbol/iterator");
  var Scheduler = {
    asap: asap_1.asap,
    async: async_1.async,
    queue: queue_1.queue
  };
  exports.Scheduler = Scheduler;
  var Symbol = {
    rxSubscriber: rxSubscriber_1.$$rxSubscriber,
    observable: observable_1.$$observable,
    iterator: iterator_1.$$iterator
  };
  exports.Symbol = Symbol;
  global.define = __define;
  return module.exports;
});

