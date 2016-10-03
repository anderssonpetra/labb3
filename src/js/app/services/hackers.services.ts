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

    removeHacker(name){
        for(let i = 0, length = this.hackers.length; i <length; i++){
            if(this.hackers[i].name === name){
                this.hackers.splice(i, 1);
            }
        }
    }

}