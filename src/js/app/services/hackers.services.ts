import {Injectable} from '@angular/core'
@Injectable()
export class HackersService {
    hackers: Array<any>;

    constructor(){
        this.hackers= [
            {name: 'Petrofs', points: 99}
        ];
    }
    getHackers(){
        return this.hackers;
    }

    addHacker(hacker){
        this.hackers.push(hacker);

    }

}