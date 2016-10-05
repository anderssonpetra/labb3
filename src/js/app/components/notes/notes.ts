import {Component} from '@angular/core';
import {HackerListComponent} from './../hackerList/hackerlist.component';

@Component({
	templateUrl: './js/app/components/notes/notes.html',
    directives: [HackerListComponent]
})
export class NotesComponent {

    constructor() {
    }
    
}