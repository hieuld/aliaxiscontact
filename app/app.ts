import {
  Component,
  enableProdMode,
  ViewChild
} from '@angular/core';

import {
  ionicBootstrap,
  Events,
  MenuController,
  Nav,
  Alert,
  NavController,
  Loading,
  Platform
} from 'ionic-angular';

import {
  StatusBar,
  Network,
  Splashscreen 
} from 'ionic-native';
import { TabsPage } from './pages/tabs/tabs';
import { AboutPage } from './pages/about/about';
import { AccountPage } from './pages/account/account';
import { UserData } from './providers/user-data/user-data';
import { ContactData } from './providers/contact-data/contact-data';
import { Conf } from './providers/conf/conf';
import { Lib } from './providers/lib/lib';
enableProdMode();

interface PageObj {
  title: string;
  component: any;
  icon: string;
  index?: number;
}

declare var navigator: any;
// declare var Connection: any;

@Component({
  templateUrl: 'build/app.html',
  providers: [UserData, ContactData]
})

class MyApp {

  @ViewChild(Nav) nav: Nav;

  appPages: PageObj[] = [
    { title: 'People', component: TabsPage, index: 0, icon: 'people' },
    { title: 'Contact', component: TabsPage, index: 1, icon: 'contacts' },
    { title: 'About', component: TabsPage, index: 2, icon: 'information-circle' },
  ];

  loggedInPages: PageObj[] = [
    { title: 'Account', component: AccountPage, icon: 'person' },
    { title: 'Logout', component: TabsPage, icon: 'log-out' },
  ];

  loggedOutPages: PageObj[] = [
    { title: 'Login', component: TabsPage, icon: 'log-in' },
  ];

  rootPage: any = TabsPage;

  constructor(
    private menu: MenuController,
    private events: Events,
    private userData: UserData,
    platform: Platform
  ) {

    // Call any initial plugins when ready
    platform.ready().then(() => {
      this.userData.login(
        () => {
          this.enableMenu(true);
          this.events.publish('fetching', false);
        },
        () => {
          this.enableMenu(false);
        }
      );

      if (Network.connection === 'none') {
        let alert = Alert.create({
          title: 'Offline',
          message: 'You are not connected to the internet, we\'ll try to use the data we stored last time you used the app. \n\nPlease note the this data might be outdated.',
          buttons: [{
            text: 'Ok',
            handler: () => {
              alert.dismiss().then(() =>
                this.openPage(this.appPages[0]), console.error
              );
            }
          }]
        });
        this.nav.present(alert);
        if ( this.userData.users.length <= 0) {
          this.userData.getLocalUsers();
        }
      } 
      Splashscreen.hide();
      StatusBar.overlaysWebView(true);
      StatusBar.backgroundColorByHexString('#1e117b');


    });

    this.listenToLoginEvents();
  }

  openPage(page: PageObj) {
    if (page.index) {
      if (page.index !== this.nav.root.tabIndex)
        this.nav.setRoot(page.component, { tabIndex: page.index });

    } else {
      this.nav.setRoot(page.component);
    }

    if (page.title === 'Logout') {
      // Give the menu time to close before changing to logged out
      this.userData.logout(
        () => { },
        () => { }
      );
    } else if (page.title === 'Login') {

      this.userData.login(
        () => { },
        () => { }
      );
    }

  }

  listenToLoginEvents() {
    this.events.subscribe('user:login', () => {
      this.enableMenu(true);
    });

    this.events.subscribe('user:logout', () => {
      this.enableMenu(false);
    });
  }

  enableMenu(loggedIn) {
    this.menu.enable(loggedIn, 'loggedInMenu');
    this.menu.enable(!loggedIn, 'loggedOutMenu');
  }
}

ionicBootstrap(MyApp, [UserData, ContactData, Conf, Lib], {
  tabbarPlacement: 'bottom'
});
;
