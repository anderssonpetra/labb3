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
    var ReverseDirective;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            }],
        execute: function() {
            //metadata
            ReverseDirective = (function () {
                function ReverseDirective(_element, _renderer) {
                    this._element = _element;
                    this._renderer = _renderer;
                }
                ReverseDirective.prototype.onKeyup = function (event) {
                    console.dir(this.msg);
                    //  console.log(event.srcElement.value.split("").reverse().join(""));
                    var rev = event.srcElement.value.split("").reverse().join("");
                    this._renderer.setElementAttribute(this.targetElement, 'value', rev);
                };
                __decorate([
                    core_1.Input('reverse'), 
                    __metadata('design:type', Object)
                ], ReverseDirective.prototype, "targetElement", void 0);
                __decorate([
                    //kan byta namn på den för att matcha bättre utanför
                    core_1.Input('hi'), 
                    __metadata('design:type', Object)
                ], ReverseDirective.prototype, "msg", void 0);
                ReverseDirective = __decorate([
                    core_1.Directive({
                        selector: '[reverse]',
                        host: {
                            '(keyup)': 'onKeyup($event)'
                        }
                    }), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof core_1.ElementRef !== 'undefined' && core_1.ElementRef) === 'function' && _a) || Object, (typeof (_b = typeof core_1.Renderer !== 'undefined' && core_1.Renderer) === 'function' && _b) || Object])
                ], ReverseDirective);
                return ReverseDirective;
                var _a, _b;
            }());
            exports_1("ReverseDirective", ReverseDirective);
        }
    }
});
