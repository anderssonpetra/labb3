import {Component} from '@angular/core';
//import {LoginService} from './../../../services/login.service'
import {AsyncValidator} from './../../../validators/async.validator'

@Component({
    selector: 'mylogin',
    //provider: [LoginService]
	templateUrl: './js/app/components/userComponents/login/login.html',
    directives: [AsyncValidator],
})
export class LoginComponent {

    user;

    constructor(/*private _loginService:LoginService*/) {
        this.user = {};
    }

    login(){
        console.log(this.user);
       // this._loginService.login(this.user);
        this.user = {};
    }

    
}