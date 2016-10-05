System.register(['@angular/core', './../../../validators/async.validator'], function(exports_1, context_1) {
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
    var core_1, async_validator_1;
    var LoginComponent;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (async_validator_1_1) {
                async_validator_1 = async_validator_1_1;
            }],
        execute: function() {
            LoginComponent = (function () {
                function LoginComponent() {
                    this.user = {};
                }
                LoginComponent.prototype.login = function () {
                    console.log(this.user);
                    this.user = {};
                };
                LoginComponent = __decorate([
                    core_1.Component({
                        selector: 'mylogin',
                        template: "         <h2>Login</h2>  <p>Logga in med anv\u00E4ndarnamn och l\u00F6senord!</p>  <form (ngSubmit)=\"login()\" #LoginForm=\"ngForm\">     <lable for=\"\">UserName: <input type=\"text\" [(ngModel)]=\"user.username\" ngControl=\"username\" required validateAsync> </lable>     <lable for=\"\">Password:: <input type=\"text\" [(ngModel)]=\"user.password\" ngControl=\"password\" required> </lable>      <button type=\"submit\" [disabled]=\"!LoginForm.form.valid\">Login</button>     <button (click)=\"goToAbout()\">Go to About</button> </form>",
                        directives: [async_validator_1.AsyncValidator],
                    }), 
                    __metadata('design:paramtypes', [])
                ], LoginComponent);
                return LoginComponent;
            }());
            exports_1("LoginComponent", LoginComponent);
        }
    }
});
