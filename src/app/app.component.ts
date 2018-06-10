import { Component, ViewChild } from '@angular/core';
import { Platform, MenuController, Nav } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  
  // make HomePage the root (of first) page
  rootPage:any = HomePage;
  pages: Array<{title: string, component: any}>;

  constructor(public platform: Platform,
    public menu: MenuControler, 
    public statusBar: StatusBar,
    public splashScreen: SplashScreen
    ) {
    this.initializeApp();

    //set our app's pages
     this.pages = [
      { title: 'Report', component: home },
      { title: 'Emergency', component: emerg }
    ];
  }

  initializeApp() {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });
    }

  openPage(page) {
    // close the menu when clicking a link from the menu
    this.menu.close();
    // navigate to the new page if it is not the current page
    this.nav.setRoot(page.component);
  }
}

