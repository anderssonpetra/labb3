import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {NorrisService} from './../../services/norris.service';

@Component({
    selector: 'norris-joke',
    template: '<ul><li *ngFor="let joke of jokes" (click)="jokeClicked(joke.joke)"> {{ joke.joke }} </li></ul>',
    styles: ['li {cursor: pointer;}'],
    providers: [NorrisService]
})
export class NorrisComponent implements OnInit{

    jokes = [];
    @Output() joke = new EventEmitter();

    constructor(private _norrisService: NorrisService){    }

    ngOnInit(){
        this.loadJokes(10);
    }
    loadJokes(num){// .then i jquery. iom observable så kan vi onservera istället. så om den uppdares så får vi uppdateringrna
       let obs =  this._norrisService.getRandomJokes(num).first().subscribe((res) => {
            this.jokes = res.value;
        });
    }

    jokeClicked(joke){
        this.joke.emit(joke);
        console.log(joke);
    }

}