System.register(['@angular/core', '@angular/common', './../../services/async.service'], function(exports_1, context_1) {
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
    var core_1, common_1, async_service_1;
    var AsyncValidator;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (common_1_1) {
                common_1 = common_1_1;
            },
            function (async_service_1_1) {
                async_service_1 = async_service_1_1;
            }],
        execute: function() {
            AsyncValidator = (function () {
                function AsyncValidator(_asyncservice) {
                    this._asyncservice = _asyncservice;
                }
                AsyncValidator.prototype.validate = function (c) {
                    var _this = this;
                    return new Promise(function (resolve, reject) {
                        _this._asyncservice.getAsyncValue(true)
                            .then(function (valid) {
                            if (!valid) {
                                resolve({ valid: false });
                            }
                            else {
                                resolve(null);
                            }
                        });
                    });
                };
                AsyncValidator = __decorate([
                    core_1.Directive({
                        selector: '[validateAsync]',
                        providers: [async_service_1.AsyncService, core_1.provide(common_1.NG_ASYNC_VALIDATORS, {
                                useExisting: AsyncValidator,
                                multi: true
                            })]
                    }), 
                    __metadata('design:paramtypes', [async_service_1.AsyncService])
                ], AsyncValidator);
                return AsyncValidator;
            }());
            exports_1("AsyncValidator", AsyncValidator);
        }
    }
});
