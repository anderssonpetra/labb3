import {Injectable, EventEmitter} from '@angular/core'

@Injectable()
export class HackersService {

    hackers: Array<any>;
    _msg;
    emitter: EventEmitter<any> = new EventEmitter();

    constructor(){
        this.hackers= [
            {name: 'Petrofs', points: 99}
        ];
        this._msg = 'default msg'; 

        //this._msg =  {text: 'default mas'}; 
        //för att åf den att visas, change detection, quick fix, öägga in det i ett object och säga attdet finns ett textobject där.
    }

    setMsg(msg){
        console.log(msg);
        this._msg = msg;
        this.emitter.emit(msg); //emittar ut till alla som lyssnar att datan ändrats, comåonenten som använder detta måste ha en emit-subscriber, glöm inte att unsubscriba 
    }

    getMsg(){
        return this._msg; //returnerar här objecter vilket vi vill. istället för .text
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