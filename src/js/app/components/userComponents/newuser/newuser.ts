import {Component} from '@angular/core';
import {HackerListComponent} from './../../hackerList/hackerlist.component';

@Component({
	templateUrl: './js/app/components/userComponents/newuser/newuser.html',
    directives: [HackerListComponent]
})
export class NewUserComponent {

    constructor() {
    }
    
}