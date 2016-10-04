import {provide, Directive} from '@angular/core';
import {Control, NG_ASYNC_VALIDATORS} from '@angular/common';
import {AsyncService} from './../../services/async.service';

@Directive({
    selector: '[validateAsync]',
    providers: [AsyncService, provide(NG_ASYNC_VALIDATORS, { //deafulr validatorer och kan stoppa in egna
        useExisting: AsyncValidator, //här lägger vi till en egen
        multi: true
    })]
})
export class AsyncValidator{
    constructor(private _asyncservice: AsyncService){
    }
    validate(c: Control){//importas
        return new Promise((resolve, reject) =>{
            this._asyncservice.getAsyncValue(true)
                .then((valid) => {
                    if(!valid){
                        resolve({valid: false})
                    }
                    else{
                        resolve(null);
                    }
                })
        })
    }
}