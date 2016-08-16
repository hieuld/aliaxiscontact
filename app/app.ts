import { Component,
         ViewChild }    from '@angular/core';

import { ionicBootstrap,
         Events,
         MenuController,
         Nav,
         Platform }     from 'ionic-angular';

import { StatusBar }    from 'ionic-native';
import { TabsPage }     from './pages/tabs/tabs';
import { AboutPage }    from './pages/about/about';
import { AccountPage }  from './pages/account/account';
import { TutorialPage } from './pages/tutorial/tutorial';
import { UserData }     from './providers/user-data/user-data';
import { ContactData }  from './providers/contact-data/contact-data';
import { Conf }         from './providers/conf/conf';
import { Lib }          from './providers/lib/lib';

interface PageObj {
    title: string;
    component: any;
    icon: string;
    index?: number;
}

@Component({
  templateUrl: 'build/app.html',
  providers:[UserData, ContactData]
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

    rootPage: any = TutorialPage;

    constructor(
        private menu: MenuController,
        private events: Events,
        private userData: UserData,
        //private contactData: ContactData,
        platform: Platform
    ){
        // Call any initial plugins when ready
        platform.ready().then(() => {

            StatusBar.styleDefault();
            // try to login
            this.userData.login(
              () => {},
              () => {}
            );
        });

        this.listenToLoginEvents();
    }

    openPage(page: PageObj){
        // the nav component was found using @ViewChild(Nav)
        // reset the nav to remove previous pages and only have this page
        // we wouldn't want the back button to show in this scenario
        if (page.index) {
            this.nav.setRoot(page.component, {tabIndex: page.index});

        } else {
            this.nav.setRoot(page.component);
        }

        if (page.title === 'Logout') {
            // Give the menu time to close before changing to logged out
            this.userData.logout(
              () => {},
              () => {}
            );
        }
        else if (page.title === 'Login') {

            this.userData.login(
              () => {},
              () => {}
            );
        }

    }

    listenToLoginEvents() {
        this.events.subscribe('user:login', () => {
            console.log('already login');
            this.enableMenu(true);
        });

        this.events.subscribe('user:logout', () => {
            console.log('already logout');
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
