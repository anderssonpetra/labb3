import {Directive, ElementRef, Renderer, Input} from '@angular/core';
 
 //metadata
@Directive({
  selector: '[reverse]', //attributnamn som används i html
  host: {
    '(keyup)': 'onKeyup($event)'
  }
})
export class ReverseDirective {


    @Input('reverse') targetElement:any; //kan byta namn på den för att matcha bättre utanför
   @Input('hi') msg:any; 
  constructor(private _element: ElementRef, private _renderer: Renderer) {
  }

  onKeyup(event){
      console.dir(this.msg);
    //  console.log(event.srcElement.value.split("").reverse().join(""));
      let rev = event.srcElement.value.split("").reverse().join("");
      this._renderer.setElementAttribute(this.targetElement, 'value', rev);
  }


}