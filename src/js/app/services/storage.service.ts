import {Injectable} from '@angular/core';

export class StorageService {
	constructor(){

	}
	
	getItem(key) {
		return localStorage.getItem(key);
	}
	
	setItem(key, value) {
		localStorage.setItem(key, value);
	}
	
	removeItem(key) {
		localStorage.removeItem(key);
	}
}
