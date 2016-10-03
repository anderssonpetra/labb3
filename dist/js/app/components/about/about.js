System.register(['@angular/core', './../hackerList/hackerlist.component', '@angular/router-deprecated'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var core_1, hackerlist_component_1, router_deprecated_1;
    var AboutComponent;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (hackerlist_component_1_1) {
                hackerlist_component_1 = hackerlist_component_1_1;
            },
            function (router_deprecated_1_1) {
                router_deprecated_1 = router_deprecated_1_1;
            }],
        execute: function() {
            AboutComponent = (function () {
                function AboutComponent(_routeParams) {
                    this._routeParams = _routeParams;
                }
                AboutComponent.prototype.ngOnInit = function () {
                    alert(this._routeParams.get('msg'));
                };
                AboutComponent = __decorate([
                    core_1.Component({
                        template: "<div class=\"row\">     <div class=\"col-sm-12\">         <h2 check-username>About</h2>  <hackerlist></hackerlist> <p>TJOPP</p>      </div> </div>",
                        directives: [hackerlist_component_1.HackerListComponent]
                    }), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof router_deprecated_1.RouteParams !== 'undefined' && router_deprecated_1.RouteParams) === 'function' && _a) || Object])
                ], AboutComponent);
                return AboutComponent;
                var _a;
            }());
            exports_1("AboutComponent", AboutComponent);
        }
    }
});
