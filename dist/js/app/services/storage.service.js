System.register([], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var StorageService;
    return {
        setters:[],
        execute: function() {
            StorageService = (function () {
                function StorageService() {
                }
                StorageService.prototype.getItem = function (key) {
                    return localStorage.getItem(key);
                };
                StorageService.prototype.setItem = function (key, value) {
                    localStorage.setItem(key, value);
                };
                StorageService.prototype.removeItem = function (key) {
                    localStorage.removeItem(key);
                };
                return StorageService;
            }());
            exports_1("StorageService", StorageService);
        }
    }
});
