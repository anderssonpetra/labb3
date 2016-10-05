import {Component} from '@angular/core';
import {AsyncValidator} from './../../../validators/async.validator'

@Component({
    selector: 'mylogin',
	templateUrl: './js/app/components/userComponents/login/login.component.html',
    directives: [AsyncValidator],
})
export class LoginComponent {

    user;

    constructor() {
        this.user = {};
    }

    login(){
        console.log(this.user);
        this.user = {};
    }

    
}