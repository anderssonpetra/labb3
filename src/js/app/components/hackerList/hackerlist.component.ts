import {Component} from '@angular/core';
import {HackersService} from './../../services/hackers.services';
import {OrderArrayByPipe} from './../../pipes/array.sort.pipes';


@Component({
    selector: 'hackerlist',
	templateUrl: './js/app/components/hackerlist/hackerlist.component.html',
    pipes : [OrderArrayByPipe]
})
export class HackerListComponent {

    hackers;
    HS:HackersService;

    constructor(hs:HackersService) {
        this.HS = hs;
        this.hackers = hs.getHackers();
    }

    removeHacker(name){
        this.HS.removeHacker(name);

    }
    
}