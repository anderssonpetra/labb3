import {Component} from '@angular/core';
import {HackerListComponent} from './../hackerList/hackerlist.component';
import {RouteParams} from '@angular/router-deprecated';
import {OnInit} from '@angular/core';
import {CheckUsername} from './../../directives/username';
import {ReverseDirective} from './../../directives/reverse.directive';
import {NorrisComponent} from './../norris/Norris.component'

@Component({
	templateUrl: './js/app/components/about/about.html',
    directives: [HackerListComponent, CheckUsername, ReverseDirective, NorrisComponent]
})
export class AboutComponent implements OnInit{

    constructor(private _routeParams:RouteParams) {

    }

    ngOnInit(){
       // alert(this._routeParams.get('msg'));
    }
}