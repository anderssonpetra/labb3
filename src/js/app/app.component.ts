import {Component} from '@angular/core';

import {RouteConfig, ROUTER_DIRECTIVES} from '@angular/router-deprecated';

import {HomeComponent} from './components/home/home';
import {AboutComponent} from './components/about/about';
import {ContactComponent} from './components/contact/contact';


@Component({
    selector: 'my-app',
    templateUrl: './js/app/app.html',
    styleUrls: ['./js/app/app.css'],
    directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([
    { path: '/home', name: 'Home', component: HomeComponent, useAsDefault: true },
    { path: '/about/:msg', name: 'About', component: AboutComponent },
    { path: '/Contact', name: 'Contact', component: ContactComponent }

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