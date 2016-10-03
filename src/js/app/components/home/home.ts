import {Component} from '@angular/core';
import {HackersService} from './../../services/hackers.services';
import {HackerListComponent} from './../hackerList/hackerlist.component';
import {Router} from '@angular/router-deprecated';


@Component({
    templateUrl: './js/app/components/home/home.html',
    styleUrls: ['./js/app/components/home/home.css'],
    directives: [HackerListComponent]
})
export class HomeComponent {

    hackers: Array<Object>;
    hacker;

    constructor(private _hackerService:HackersService, private _router:Router) {
        this.hackers = _hackerService.getHackers();
        this.hacker = {};
    }
   // saveHacker() {
    //     this._hackerService.addHacker(this.hacker);
    //     this.hacker = {};
    // }

    goToAbout(){
        let link = ['About', {msg: 'hej jag är en param '}];
        this._router.navigate(link);
    }
}

//  constructor() {

//         this.hackers = [
//             { name: 'petra', points: '100' },
//             { name: 'hanna', points: '150' },
//             { name: 'elin', points: '188' },
//             { name: 'freja', points: '122' },
//         ];
//         this.hacker = {};
//     }