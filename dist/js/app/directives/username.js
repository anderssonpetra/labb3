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
    var CheckUsername;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            }],
        execute: function() {
            //metadata
            CheckUsername = (function () {
                function CheckUsername(_element, _renderer) {
                    this._element = _element;
                    this._renderer = _renderer;
                    _renderer.setElementStyle(_element.nativeElement, 'color', 'red');
                }
                CheckUsername.prototype.onMouse = function () {
                    this._renderer.setElementStyle(this._element.nativeElement, 'color', 'red');
                };
                CheckUsername = __decorate([
                    core_1.Directive({
                        selector: '[check-username]',
                        host: {
                            '(mouseenter)': 'onMouse()'
                        }
                    }), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof core_1.ElementRef !== 'undefined' && core_1.ElementRef) === 'function' && _a) || Object, (typeof (_b = typeof core_1.Renderer !== 'undefined' && core_1.Renderer) === 'function' && _b) || Object])
                ], CheckUsername);
                return CheckUsername;
                var _a, _b;
            }());
            exports_1("CheckUsername", CheckUsername);
        }
    }
});
