import {Component} from '@angular/core';
import {HackersService} from './../../services/hackers.services';
import {OrderArrayByPipe} from './../../pipes/array.sort.pipes';


@Component({
	templateUrl: './js/app/components/about/about.html',
    pipes : [OrderArrayByPipe]
})
export class AboutComponent {
    hackers;

    constructor(hs:HackersService) {
        this.hackers = hs.getHackers();
    }
    
}