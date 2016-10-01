import {Component} from '@angular/core';

import {RouteConfig, ROUTER_DIRECTIVES} from '@angular/router-deprecated';

import {HomeComponent} from './components/home/home';
import {AboutComponent} from './components/about/about';


@Component({
    selector: 'my-app',
    templateUrl: './js/app/app.html',
    styleUrls: ['./js/app/app.css'],
    directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([
    { path: '/home', name: 'Home', component: HomeComponent, useAsDefault: true },
    { path: '/about', name: 'About', component: AboutComponent }
])
export class AppComponent {
    menuActive: boolean;

    constructor() {
        this.menuActive = false;
    }
	 
    //Click on menu button (visible on small screen).
    showHideMenu() {
        this.menuActive = this.menuActive ? false : true;
    }


}