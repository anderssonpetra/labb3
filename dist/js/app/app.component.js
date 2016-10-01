System.register(['@angular/core', '@angular/router-deprecated', './components/home/home', './components/about/about'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var core_1, router_deprecated_1, home_1, about_1;
    var AppComponent;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (router_deprecated_1_1) {
                router_deprecated_1 = router_deprecated_1_1;
            },
            function (home_1_1) {
                home_1 = home_1_1;
            },
            function (about_1_1) {
                about_1 = about_1_1;
            }],
        execute: function() {
            AppComponent = (function () {
                function AppComponent() {
                    this.menuActive = false;
                }
                //Click on menu button (visible on small screen).
                AppComponent.prototype.showHideMenu = function () {
                    this.menuActive = this.menuActive ? false : true;
                };
                AppComponent = __decorate([
                    core_1.Component({
                        selector: 'my-app',
                        template: "<div id=\"layout\" [class.active]=\"menuActive\">     <!-- Menu toggle -->     <a id=\"menuLink\" class=\"menu-link\" (click)=\"showHideMenu()\">         <span></span>     </a> \t<!-- Side menu -->     <div id=\"menu\" [class.active]=\"menuActive\">         <div class=\"pure-menu\">             <a class=\"pure-menu-heading\" href=\"#\">Menu</a>              <ul class=\"pure-menu-list\">                 <li class=\"pure-menu-item\"><a class=\"pure-menu-link\" [class.active]=\"menuActive\" [routerLink]=\"['Home']\"><i class=\"fa fa-chevron-right\"></i> Home</a></li>                 <li class=\"pure-menu-item\"><a class=\"pure-menu-link\" [class.active]=\"menuActive\" [routerLink]=\"['About']\"><i class=\"fa fa-chevron-right\"></i> About</a></li>             </ul>         </div>     </div> \t \t<!-- Main content -->     <div id=\"main\">         <div class=\"header\">             <h1>Notetaker</h1>             <h2>Store your notes 4ever</h2>         </div>                  <div class=\"content\">   \t\t\t<!-- Routed views go here --> \t\t\t<router-outlet></router-outlet>         </div> \t\t     </div> </div>",
                        styles: ["/* Add transition to containers so they can push in and out. */ #layout, #menu, .menu-link {     -webkit-transition: all 0.2s ease-out;     -moz-transition: all 0.2s ease-out;     -ms-transition: all 0.2s ease-out;     -o-transition: all 0.2s ease-out;     transition: all 0.2s ease-out; }  /* This is the parent <div> that contains the menu and the content area. */ #layout {     position: relative;     padding-left: 0; }     #layout.active #menu {         left: 150px;         width: 150px;     }      #layout.active .menu-link {         left: 150px;     }      /* The content <div> is where all your content goes. */ .content {     margin: 0 auto;     padding: 0 2em;     max-width: 1000px;     margin-bottom: 50px;     line-height: 1.6em; } .header {      margin: 0;      color: #333;      text-align: center;      padding: 2.5em 2em 0;      border-bottom: 1px solid #eee;  }     .header h1 {         margin: 0.2em 0;         font-size: 3em;         font-weight: 300;     }      .header h2 {         font-weight: 300;         color: #ccc;         padding: 0;         margin-top: 0;     }  .content-subhead {     margin: 50px 0 20px 0;     font-weight: 300;     color: #888; } /* The #menu <div> is the parent <div> that contains the .pure-menu that appears on the left side of the page. */  #menu {     margin-left: -150px; /* \"#menu\" width */     width: 150px;     position: fixed;     top: 0;     left: 0;     bottom: 0;     z-index: 1000; /* so the menu or its navicon stays above all content */     background: #191818;     overflow-y: auto;     -webkit-overflow-scrolling: touch; }     /*     All anchors inside the menu should be styled like this.     */     #menu a {         color: #999;         border: none;         padding: 0.6em 0 0.6em 0.6em;     }      /*     Remove all background/borders, since we are applying them to #menu.     */      #menu .pure-menu,      #menu .pure-menu ul {         border: none;         background: transparent;     }      /*     Add that light border to separate items into groups.     */     #menu .pure-menu ul,     #menu .pure-menu .menu-item-divided {         border-top: 1px solid #333;     }         /*         Change color of the anchor links on hover/focus.         */         #menu .pure-menu li a:hover,         #menu .pure-menu li a:focus {             background: #333;         }      /*     This styles the selected menu item <li>.     */     #menu .pure-menu-selected,     #menu .pure-menu-heading {         background: #1f8dd6;     }         /*         This styles a link within a selected menu item <li>.         */         #menu .pure-menu-selected a {             color: #fff;         }      /*     This styles the menu heading.     */     #menu .pure-menu-heading {         font-size: 110%;         color: #fff;         margin: 0;     } /* -- Dynamic Button For Responsive Menu -------------------------------------*/  /* The button to open/close the Menu is custom-made and not part of Pure. Here's how it works: */  /* .menu-link represents the responsive menu toggle that shows/hides on small screens. */ .menu-link {     position: fixed;     display: block; /* show this only on small screens */     top: 0;     left: 0; /* \"#menu width\" */     background: #000;     background: rgba(0,0,0,0.7);     font-size: 10px; /* change this value to increase/decrease button size */     z-index: 10;     width: 2em;     height: auto;     padding: 2.1em 1.6em;     cursor: pointer; }      .menu-link:hover,     .menu-link:focus {         background: #000;     }      .menu-link span {         position: relative;         display: block;     }      .menu-link span,     .menu-link span:before,     .menu-link span:after {         background-color: #fff;         width: 100%;         height: 0.2em;     }          .menu-link span:before,         .menu-link span:after {             position: absolute;             margin-top: -0.6em;             content: \" \";         }          .menu-link span:after {             margin-top: 0.6em;         }   /* -- Responsive Styles (Media Queries) ------------------------------------- */  /* Hides the menu at 48em, but modify this based on your app's needs. */ @media (min-width: 48em) {      .header,     .content {         padding-left: 2em;         padding-right: 2em;     }      #layout {         padding-left: 150px; /* left col width \"#menu\" */         left: 0;     }     #menu {         left: 150px;     }      .menu-link {         position: fixed;         left: 150px;         display: none;     }      #layout.active .menu-link {         left: 150px;     } }  @media (max-width: 48em) {     /* Only apply this when the window is small. Otherwise, the following     case results in extra padding on the left:         * Make the window small.         * Tap the menu to trigger the active state.         * Make the window large again.     */     #layout.active {         position: relative;         left: 150px;     } }"],
                        directives: [router_deprecated_1.ROUTER_DIRECTIVES]
                    }),
                    router_deprecated_1.RouteConfig([
                        { path: '/home', name: 'Home', component: home_1.HomeComponent, useAsDefault: true },
                        { path: '/about', name: 'About', component: about_1.AboutComponent }
                    ]), 
                    __metadata('design:paramtypes', [])
                ], AppComponent);
                return AppComponent;
            }());
            exports_1("AppComponent", AppComponent);
        }
    }
});