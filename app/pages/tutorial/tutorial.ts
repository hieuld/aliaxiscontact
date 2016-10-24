import { Component } from '@angular/core';
import { MenuController, NavController, Loading } from 'ionic-angular';
import { TabsPage } from '../tabs/tabs';
import { ContactData } from '../../providers/contact-data/contact-data';

@Component({
  templateUrl: 'build/pages/tutorial/tutorial.html',
})

export class TutorialPage {

  constructor(private nav: NavController, private menu: MenuController, private contactData: ContactData) { }

  presentLoadingDefault() { }

  presentLoadingCustom() { }

  presentLoadingText() { }

  startApp() {
    this.nav.push(TabsPage);
  }

  show1() {
    this.presentLoadingDefault();
  }

  show2() {
    this.presentLoadingCustom();
  }

  show3() {
    this.presentLoadingText();
  }

  ionViewDidEnter() {
    this.menu.enable(false);
    this.show1();
  }

  ionViewWillLeave() {
    this.menu.enable(true);
  }
}
