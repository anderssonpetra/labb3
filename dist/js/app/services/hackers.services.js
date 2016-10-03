System.register(['@angular/core'], function(exports_1, context_1) {
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
    var core_1;
    var HackersService;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            }],
        execute: function() {
            HackersService = (function () {
                function HackersService() {
                    this.hackers = [
                        { name: 'Petrofs', points: 99 }
                    ];
                }
                HackersService.prototype.getHackers = function () {
                    return this.hackers;
                };
                HackersService.prototype.addHacker = function (hacker) {
                    this.hackers.push(hacker);
                };
                HackersService.prototype.removeHacker = function (name) {
                    for (var i = 0, length_1 = this.hackers.length; i < length_1; i++) {
                        if (this.hackers[i].name === name) {
                            this.hackers.splice(i, 1);
                        }
                    }
                };
                HackersService = __decorate([
                    core_1.Injectable(), 
                    __metadata('design:paramtypes', [])
                ], HackersService);
                return HackersService;
            }());
            exports_1("HackersService", HackersService);
        }
    }
});
