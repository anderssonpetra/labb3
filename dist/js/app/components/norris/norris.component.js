System.register(['@angular/core', './../../services/norris.service'], function(exports_1, context_1) {
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
    var core_1, norris_service_1;
    var NorrisComponent;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (norris_service_1_1) {
                norris_service_1 = norris_service_1_1;
            }],
        execute: function() {
            NorrisComponent = (function () {
                function NorrisComponent(_norrisService) {
                    this._norrisService = _norrisService;
                    this.jokes = [];
                    this.joke = new core_1.EventEmitter();
                }
                NorrisComponent.prototype.ngOnInit = function () {
                    this.loadJokes(10);
                };
                NorrisComponent.prototype.loadJokes = function (num) {
                    var _this = this;
                    var obs = this._norrisService.getRandomJokes(num).first().subscribe(function (res) {
                        _this.jokes = res.value;
                    });
                };
                NorrisComponent.prototype.jokeClicked = function (joke) {
                    this.joke.emit(joke);
                    console.log(joke);
                };
                __decorate([
                    core_1.Output(), 
                    __metadata('design:type', Object)
                ], NorrisComponent.prototype, "joke", void 0);
                NorrisComponent = __decorate([
                    core_1.Component({
                        selector: 'norris-joke',
                        template: '<ul><li *ngFor="let joke of jokes" (click)="jokeClicked(joke.joke)"> {{ joke.joke }} </li></ul>',
                        styles: ['li {cursor: pointer;}'],
                        providers: [norris_service_1.NorrisService]
                    }), 
                    __metadata('design:paramtypes', [norris_service_1.NorrisService])
                ], NorrisComponent);
                return NorrisComponent;
            }());
            exports_1("NorrisComponent", NorrisComponent);
        }
    }
});
