import { Component } from '@angular/core';
import { MenuController, NavController, Loading } from 'ionic-angular';
import { TabsPage } from '../tabs/tabs';
import { ContactData } from '../../providers/contact-data/contact-data';

@Component({
    templateUrl: 'build/pages/tutorial/tutorial.html',
})

export class TutorialPage {

    constructor(private nav: NavController, private menu: MenuController, private contactData: ContactData) {}

    presentLoadingDefault() {
      // let loading = Loading.create({
      //   content: 'Loading Contact...'
      // });
      //
      // this.nav.present(loading);
      //
      // this.contactData.loadContacts(
      //   () => {
      //     // setTimeout(() => {
      //     //   loading.dismiss();
      //     //   this.startApp();
      //     // }, 1000);
      //     console.log('miljaar de doeme');
      //     loading.dismiss();
      //     this.startApp();
      //   },
      //   err => {
      //     console.error(err);
      //   }
      // );
    }

    presentLoadingCustom() {
      // let loading = Loading.create({
      //   spinner: 'hide',
      //   content: `
      //     <div class="custom-spinner-container">
      //     <div class="custom-spinner-box"></div>
      //     </div>`,
      //   duration: 5000
      // });
      //
      // loading.onDismiss(() => {
      //   console.log('Dismissed loading');
      // });
      //
      // this.nav.present(loading);
    }

    presentLoadingText() {
      // let loading = Loading.create({
      //   spinner: 'hide',
      //   content: 'Loading Please Wait...'
      // });
      //
      // this.nav.present(loading);
      //
      // setTimeout(() => {
      //
      // }, 1000);
      //
      // setTimeout(() => {
      //   loading.dismiss();
  // }, 5000);
    }


    startApp() {
        this.nav.push(TabsPage);
    }

    show1() {
      console.log('show1');
      this.presentLoadingDefault();
    }

    show2() {
      console.log('show2');
      this.presentLoadingCustom();
    }

    show3() {
      console.log('show3');
      this.presentLoadingText();
    }

    ionViewDidEnter() {
      console.log('Tutorial ionViewDidEnter');
      this.menu.enable(false);
      this.show1();
    }

    ionViewWillLeave() {
        this.menu.enable(true);
    }
}
