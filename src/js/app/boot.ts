import {bootstrap} from '@angular/platform-browser-dynamic';
import {provide} from '@angular/core';
import {ROUTER_PROVIDERS} from '@angular/router-deprecated';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {AppComponent} from './app.component';
import {HTTP_BINDINGS} from '@angular/http';
import {StorageService} from './services/storage.service';
import {enableProdMode} from "@angular/core";
import {HackersService} from './services/hackers.services';


//enableProdMode();

bootstrap(AppComponent, [
  ROUTER_PROVIDERS,
  provide(LocationStrategy, {useClass: HashLocationStrategy}),
  HTTP_BINDINGS,
  StorageService,
  HackersService
]);

