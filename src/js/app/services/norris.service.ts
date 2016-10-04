import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Observable} from 'rxjs/Rx';


@Injectable()
export class NorrisService {
    
    _apiAdress =  'http://api.icndb.com/jokes/random/'
    _headers: Headers;

    constructor(private _http: Http){
        this._headers = new Headers();
        this._headers.append('Accept', 'application/json');
    }

    getRandomJokes(num){
        return this._http.get(this._apiAdress+num, {
            headers: this._headers
        })
        .map((res) => res.json() )
        .catch((err) => {
            console.dir(err);
            return Observable.throw(err);
        });
        //observerbl istället för promise som skickas ttbx

    }

}