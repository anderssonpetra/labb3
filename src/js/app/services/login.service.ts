import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Observable} from 'rxjs/Rx';

@Injectable()
export class LoginService {
    
    _apiAdress =  'http://localhost:4500/api/login/'
    _headers: Headers;
    user;
    body;
    extractData;
    handleError;

    constructor(private _http: Http){
        this._headers = new Headers();
        this._headers.append('Accept', 'application/json');
        this.body =  {"username": this.user.username ,"password": this.user.password};
    }

    login(user){
        this.user = user;
        let data = this._http.post(this._apiAdress, this.body)
                .map(this.extractData)
                .catch(this.handleError);

        console.log(data);
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