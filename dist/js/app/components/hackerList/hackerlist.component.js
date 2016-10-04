System.register(['@angular/core', './../../services/hackers.services', './../../pipes/array.sort.pipes'], function(exports_1, context_1) {
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
    var core_1, hackers_services_1, array_sort_pipes_1;
    var HackerListComponent;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (hackers_services_1_1) {
                hackers_services_1 = hackers_services_1_1;
            },
            function (array_sort_pipes_1_1) {
                array_sort_pipes_1 = array_sort_pipes_1_1;
            }],
        execute: function() {
            HackerListComponent = (function () {
                function HackerListComponent(_hs) {
                    var _this = this;
                    this._hs = _hs;
                    this.hackers = _hs.getHackers();
                    this.msg = _hs.getMsg();
                    this.sub = _hs.emitter.subscribe(function (msg) {
                        _this.msg = msg;
                    });
                }
                HackerListComponent.prototype.ngOnDestroy = function () {
                    console.log('unsubscribes');
                    this.sub.unsubscribe();
                };
                HackerListComponent.prototype.removeHacker = function (name) {
                    this._hs.removeHacker(name);
                };
                HackerListComponent = __decorate([
                    core_1.Component({
                        selector: 'hackerlist',
                        template: "<ul>     <li *ngFor=\"let hacker of hackers | OrderArray:'-points'\" (click)=\"removeHacker(hacker.name)\">         {{hacker.points + ':' + hacker.name}}     </li> </ul>  <p>{{msg}}</p>",
                        pipes: [array_sort_pipes_1.OrderArrayByPipe]
                    }), 
                    __metadata('design:paramtypes', [hackers_services_1.HackersService])
                ], HackerListComponent);
                return HackerListComponent;
            }());
            exports_1("HackerListComponent", HackerListComponent);
        }
    }
});
