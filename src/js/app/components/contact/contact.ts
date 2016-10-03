import {Component} from '@angular/core';
import {HackerListComponent} from './../hackerList/hackerlist.component';

@Component({
	templateUrl: './js/app/components/contact/contact.html',
    directives: [HackerListComponent]
})
export class ContactComponent {

    constructor() {
    }
    
}