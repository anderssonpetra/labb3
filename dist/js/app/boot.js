System.register(['@angular/platform-browser-dynamic', '@angular/core', '@angular/router-deprecated', '@angular/common', './app.component', '@angular/http', './services/storage.service', './services/hackers.services'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var platform_browser_dynamic_1, core_1, router_deprecated_1, common_1, app_component_1, http_1, storage_service_1, hackers_services_1;
    return {
        setters:[
            function (platform_browser_dynamic_1_1) {
                platform_browser_dynamic_1 = platform_browser_dynamic_1_1;
            },
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (router_deprecated_1_1) {
                router_deprecated_1 = router_deprecated_1_1;
            },
            function (common_1_1) {
                common_1 = common_1_1;
            },
            function (app_component_1_1) {
                app_component_1 = app_component_1_1;
            },
            function (http_1_1) {
                http_1 = http_1_1;
            },
            function (storage_service_1_1) {
                storage_service_1 = storage_service_1_1;
            },
            function (hackers_services_1_1) {
                hackers_services_1 = hackers_services_1_1;
            }],
        execute: function() {
            //enableProdMode();
            platform_browser_dynamic_1.bootstrap(app_component_1.AppComponent, [
                router_deprecated_1.ROUTER_PROVIDERS,
                core_1.provide(common_1.LocationStrategy, { useClass: common_1.HashLocationStrategy }),
                http_1.HTTP_BINDINGS,
                storage_service_1.StorageService,
                hackers_services_1.HackersService
            ]);
        }
    }
});
