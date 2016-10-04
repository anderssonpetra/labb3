import {Injectable} from '@angular/core';

@Injectable()
export class AsyncService{
    constructor(){}

    getAsyncValue(succeed){
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(succeed);
            }, 1000);// efter en sec så kommer alla then som vi kopplat till detta promis köras
        });
    }
}