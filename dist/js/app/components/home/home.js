System.register(['@angular/core', './../../services/hackers.services', './../hackerList/hackerlist.component', '@angular/router-deprecated'], function(exports_1, context_1) {
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
    var core_1, hackers_services_1, hackerlist_component_1, router_deprecated_1;
    var HomeComponent;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (hackers_services_1_1) {
                hackers_services_1 = hackers_services_1_1;
            },
            function (hackerlist_component_1_1) {
                hackerlist_component_1 = hackerlist_component_1_1;
            },
            function (router_deprecated_1_1) {
                router_deprecated_1 = router_deprecated_1_1;
            }],
        execute: function() {
            HomeComponent = (function () {
                function HomeComponent(_hackerService, _router) {
                    this._hackerService = _hackerService;
                    this._router = _router;
                    this.hackers = _hackerService.getHackers();
                    this.hacker = {};
                }
                // saveHacker() {
                //     this._hackerService.addHacker(this.hacker);
                //     this.hacker = {};
                // }
                HomeComponent.prototype.goToAbout = function () {
                    var link = ['About', { msg: 'hej jag är en param ' }];
                    this._router.navigate(link);
                };
                HomeComponent = __decorate([
                    core_1.Component({
                        template: "<div class=\"row\">     <div class=\"col-sm-12\">         <h2>Home</h2>          <hackerlist></hackerlist>  <form (ngSubmit)=\"saveHacker()\" #hackerForm=\"ngForm\">     <lable for=\"\">Name: <input type=\"text\" [(ngModel)]=\"hacker.name\" ngControl=\"name\" required> </lable>     <lable for=\"\">Points: <input type=\"text\" [(ngModel)]=\"hacker.points\" ngControl=\"points\" required> </lable>      <button type=\"submit\" [disabled]=\"!hackerForm.form.valid\">Save</button>     <button (click)=\"goToAbout()\">Go to About</button> </form>     </div> </div>",
                        styles: ["h2 { \t }  .ng-valid[required]{     border-left: 5px solid green; }"],
                        directives: [hackerlist_component_1.HackerListComponent]
                    }), 
                    __metadata('design:paramtypes', [hackers_services_1.HackersService, (typeof (_a = typeof router_deprecated_1.Router !== 'undefined' && router_deprecated_1.Router) === 'function' && _a) || Object])
                ], HomeComponent);
                return HomeComponent;
                var _a;
            }());
            exports_1("HomeComponent", HomeComponent);
        }
    }
});
//  constructor() {
//         this.hackers = [
//             { name: 'petra', points: '100' },
//             { name: 'hanna', points: '150' },
//             { name: 'elin', points: '188' },
//             { name: 'freja', points: '122' },
//         ];
//         this.hacker = {};
//     } 
