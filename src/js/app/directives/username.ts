import {Directive, ElementRef, Renderer} from '@angular/core';
 
 //metadata
@Directive({
  selector: '[check-username]', //attributnamn som används i html
  host: {
    '(mouseenter)': 'onMouse()'
  }
})
export class CheckUsername {
  constructor(private _element: ElementRef, private _renderer: Renderer) {
     _renderer.setElementStyle(_element.nativeElement, 'color', 'red');
  }

  onMouse(){
    this._renderer.setElementStyle(this._element.nativeElement, 'color', 'red');
  }


}