import {Component, OnDestroy} from '@angular/core';
import {HackersService} from './../../services/hackers.services';
import {OrderArrayByPipe} from './../../pipes/array.sort.pipes';


@Component({
    selector: 'hackerlist',
    providers: [HackersService],
	templateUrl: './js/app/components/hackerlist/hackerlist.component.html',
    pipes : [OrderArrayByPipe],
})
export class HackerListComponent implements OnDestroy{

    hackers;
    msg;
    sub;

    constructor(private _hs:HackersService) {
        this.hackers = _hs.getHackers();
        this.msg = _hs.getMsg();

        this.sub = _hs.emitter.subscribe((msg) => {
            this.msg = msg; 
        });
    }
    ngOnDestroy(){
        console.log('unsubscribes');
        this.sub.unsubscribe();
    }
    removeHacker(name){
        this._hs.removeHacker(name);

    }
    
}