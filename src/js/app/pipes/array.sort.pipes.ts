import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'OrderArray', pure:false})

export class OrderArrayByPipe implements PipeTransform{

    transform(array, args){
        if (typeof args[0]=== "undefined"){
            return array;
        }

        let order=args[0];
        let property = args.slice(1);

        array.sort((a, b) => {
            let left = Number(a[property]);
            let right = Number(b[property]);

            return (order ===  "-") ? right - left : left - right;
        });

        return array;
    }
}