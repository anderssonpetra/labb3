import {Directive, ElementRef, Renderer} from '@angular/core';
 
@Directive({
  selector: '[check-username]'
})
export class CheckUsername {
  constructor(private _element: ElementRef, private _renderer: Renderer) {
     _renderer.setElementStyle(_element.nativeElement, 'color', 'red');
  }

}