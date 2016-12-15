import { Component } from '@angular/core';
import { Events, Loading, NavController, Alert, Platform } from 'ionic-angular';
import { Toast, SocialSharing, SMS, Network, CallNumber, Keyboard } from 'ionic-native';
import { DomSanitizationService  } from '@angular/platform-browser';
import { UserData } from '../../providers/user-data/user-data';
import { ContactData } from '../../providers/contact-data/contact-data';
import { Lib } from '../../providers/lib/lib';

@Component({
  templateUrl: 'build/pages/user-list/user-list.html'
})

export class UserListPage {
  users = [];
  savedUsers = [];
  userThumbs = {};
  prevValue: string = '';
  search: string = 'Name';
  searchValue: string = '';
  cancelled: boolean = false;
  find: boolean = false;
  loading: Loading;

  constructor(
    private nav: NavController,
    private userData: UserData,
    private contactData: ContactData,
    private events: Events,
    private platform: Platform,
    private sanitizer: DomSanitizationService
  ) { }

  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl('sms:' + url);
  }

  ionViewWillEnter() {
    this.users = this.userData.users;
  }

  ionViewDidEnter() {
    this.doSubscribe();
    if (this.users.length === 0 && !this.platform.is('ios')) {
      this.loading = Loading.create({
        content: 'Loading users...',
        dismissOnPageChange: true
      });
      this.nav.present(this.loading);
    }
    Keyboard.hideKeyboardAccessoryBar(false);
  }

  getNextPage(infiniteScroll) {
    if (this.find) {
      infiniteScroll.complete();
    } else {
      this.userData.getNextPage(infiniteScroll);
      this.updateUserThumbs();
    }
  }

  updateUserThumbs() {
    this.userData.updateUserThumbs();
    // this.userThumbs = this.userData.userThumbs;
  }

  ionViewDidLeave() {
    this.userData.cacheUserThumbs();
    this.doUnsubscribe();
  }

  doUnsubscribe() {
    this.events.unsubscribe('users:change', () => { });
  }

  doSubscribe() {
    this.events.subscribe('users:change', (userEventData) => {
      if (!Lib.hasElementArray(userEventData)) return;
      if (this.users.length === 0) {
      }
      var newUsers = userEventData[0];
      var len = newUsers.length;

      (len === 0) ? (this.users.length = 0) : (this.setUsers(false));
      // this.updateUserThumbs();
      this.savedUsers = newUsers;
    });

    this.events.subscribe('user:logout', () => {
      this.doUnsubscribe();
      this.loading.dismiss();
    });

    this.events.subscribe('user:initialLogin', () => {
      if (!this.platform.is('ios')) {
        this.loading = Loading.create({
          content: 'Loading users...',
          dismissOnPageChange: true
        });
        this.nav.present(this.loading);
      }
    });
  }

  setUsers(setSaved: boolean) {
    if (setSaved) {
      this.userData.users = this.userData.savedUsers;
    }
    this.users = this.userData.users;
  }

  hideKeyboard() {
    Keyboard.close();
  }

  searchUser(ev: any) {

    var val = ev.target.value;
    var searchType;
    this.find = true;
    // if the value is an empty string don't filter the items
    if (val && val.trim() !== '') {
      switch (this.search) {
        case 'Job':
          searchType = 'jobTitle';
          break;
        case 'Department':
          searchType = 'department';
          break;
        default:
          searchType = 'displayName';
          break;
      }
      this.userData.findUser(val, searchType);
    } else {
      this.setUsers(true);
      this.find = false;

    }
    this.prevValue = val;
  }

  doImport(user) {
    Toast.show('Contact saved!', '3000', 'top').subscribe(
      toast => {
        user.photo = this.userThumbs[user.userPrincipalName];
        this.contactData.importUser(user);
      },
      error => {
        console.error('Error', error);
      },
      () => {
        console.error('Completed');
      }
    );
  }

  doCall(user) {
    Lib.call(user.mobilePhone);
  }

  doText(user) {
    if (this.platform.is('android')) {
      Lib.text(user.mobilePhone, '');
    }
  }

  buildVCard(user) {
    var str = user.displayName + '\n';
    (user.mobilePhone) ? (str += 'Mobile: ' + user.mobilePhone + '\n') : ('');
    (user.businessPhones[0]) ? (str += 'Business Phone: ' + user.businessPhones[0] + '\n') : ('');
    (user.department) ? (str += 'Department: ' + user.department + '\n') : ('');
    (user.jobTitle) ? (str += 'Job Title: ' + user.jobTitle + '\n') : ('');
    (user.mail) ? (str += 'Email: ' + user.mail + '\n') : ('');
    (user.thumbnail) ? (str += user.thumbnail + '\n') : ('');
    var vcard = str;
    return vcard;
  }

  doShare(user) {
    var vcard = this.buildVCard(user);
    Lib.share(vcard, user.displayName, this.updateUserThumbs[user.userPrincipalName], '');
  }

  doAlert(message: string) {
    let alert = Alert.create({
      title: 'Message',
      subTitle: message,
      buttons: ['OK']
    });
    this.nav.present(alert);
  }
}
