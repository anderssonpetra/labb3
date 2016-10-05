System.register(['@angular/core', '@angular/http', 'rxjs/Rx'], function(exports_1, context_1) {
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
    var core_1, http_1, Rx_1;
    var LoginService;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (http_1_1) {
                http_1 = http_1_1;
            },
            function (Rx_1_1) {
                Rx_1 = Rx_1_1;
            }],
        execute: function() {
            LoginService = (function () {
                function LoginService(_http) {
                    this._http = _http;
                    this._apiAdress = 'http://localhost:4500/spi/login/';
                    this._headers = new http_1.Headers();
                    this._headers.append('Accept', 'application/json');
                    this.body = { "username": this.user.username, "password": this.user.password };
                }
                LoginService.prototype.login = function (user) {
                    this.user = user;
                    var data = this._http.post(this._apiAdress, this.body)
                        .map(this.extractData)
                        .catch(this.handleError);
                    console.log(data);
                };
                LoginService.prototype.getRandomJokes = function (num) {
                    return this._http.get(this._apiAdress + num, {
                        headers: this._headers
                    })
                        .map(function (res) { return res.json(); })
                        .catch(function (err) {
                        console.dir(err);
                        return Rx_1.Observable.throw(err);
                    });
                    //observerbl istället för promise som skickas ttbx
                };
                LoginService = __decorate([
                    core_1.Injectable(), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof http_1.Http !== 'undefined' && http_1.Http) === 'function' && _a) || Object])
                ], LoginService);
                return LoginService;
                var _a;
            }());
            exports_1("LoginService", LoginService);
        }
    }
});
