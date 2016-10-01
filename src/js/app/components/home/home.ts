import {Component} from '@angular/core';
import {OrderArrayByPipe} from './../../pipes/array.sort.pipes';
import {HackersService} from './../../services/hackers.services';

@Component({
    pipes : [OrderArrayByPipe],
    templateUrl: './js/app/components/home/home.html',
    styleUrls: ['./js/app/components/home/home.css'],
})
export class HomeComponent {

    hackers: Array<Object>;
    hacker;
    HS:HackersService;

    constructor(hs:HackersService) {

        this.HS = hs;
        this.hackers = hs.getHackers();
        this.hacker = {};
    }
    saveHacker() {
        this.hackers.push(Object.assign({}, this.hacker));
        this.hacker = {};
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