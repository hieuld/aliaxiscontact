import { Component } from '@angular/core';
import { Events, Loading, ActionSheet, NavController, Alert } from 'ionic-angular';
import { Toast, SocialSharing } from 'ionic-native';
import { UserData } from '../../providers/user-data/user-data';
import { ContactData } from '../../providers/contact-data/contact-data';
import { Lib } from '../../providers/lib/lib';
import { DomSanitizationService  } from '@angular/platform-browser';

@Component({
  templateUrl: 'build/pages/user-list/user-list.html'
})

export class UserListPage {
  actionSheet: ActionSheet;
  users = [];
  savedUsers = [];
  userThumbs = {};
  prevValue = '';
  search = 'Name';
  loading = Loading.create({
    content: 'Loading Users...'
  });

  constructor(
    private nav: NavController,
    private userData: UserData,
    private contactData: ContactData,
    private events: Events,
    private sanitizer: DomSanitizationService) { }


  sanitize(url: string) {
    return this.userData[url];

    // this.userData.fetchProfilePictureById(url, false);
    // return this.sanitizer.bypassSecurityTrustUrl(this.userData.userThumbs[url]);
  }

  ionViewWillEnter() {
    if (this.users.length === 0) {
      this.getUsers();
    }
    this.savedUsers = this.users;
    // this.userData.getUserThumbs();
    this.doSubscribe();
  }

  ionViewDidEnter() {
    this.updateUserThumbs();
  }


  getUsers() {

    if (this.users.length <= 0) {
      this.setUsers(this.userData.getUsers(this.nav));
    }
    this.savedUsers = this.userData.getUsers(this.nav);
    this.userData.getUserThumbs();
    this.userThumbs = this.userData.userThumbs;
  }

  getNextPage(infiniteScroll) {
    this.userData.getNextPage(infiniteScroll);
  }

  updateUserThumbs() {
    this.userData.updateUserThumbs();
    this.userThumbs = this.userData.userThumbs;
  }

  ionViewDidLeave() {
    this.userData.cacheUserThumbs();
    this.events.unsubscribe('users:change', () => { });
  }

  doSubscribe() {
    this.events.subscribe('users:change', (userEventData) => {

      if (!Lib.hasElementArray(userEventData)) return;

      var newUsers = userEventData[0];
      var len = newUsers.length;

      (len === 0) ? (this.users.length = 0) : (this.setUsers(newUsers));
    });
  }

  setUsers(users) {
    this.users = users;
  }

  searchUser(ev: any) {
    // Reset items back to all of the items
    if (!this.savedUsers || this.savedUsers.length === 0) {
      this.savedUsers = this.users;
    }
    this.users = this.savedUsers;
    // set val to the value of the rchbar
    let val = ev.target.value;
    var searchType;

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
    // if the value is an empty string don't filter the items
    if (val && val.trim() !== '' && (val.length) >= 3) {
      this.userData.findUser(val, searchType);
    } else {
      this.users = this.savedUsers;
    }
    this.prevValue = val;
  }

  doImport(user) {
    Toast.show('Contact saved!', '5000', 'top').subscribe(
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

    if (!Lib.hasValue(user)) { console.error('user = null'); return; }
    if (!Lib.hasValue(user.mobile)) { console.error('no phone number'); return; }
    Lib.call(user.mobile);
  }

  doText(user) {
    if (!Lib.hasValue(user)) { console.error('user = null'); return; }
    if (!Lib.hasValue(user.mobile)) { console.error('no phone number'); return; }
    Lib.text(user.mobile);
  }

  buildVCard(contact) {
    var str = contact.displayName + '\n';
    (contact.mobile) ? (str += 'Mobile: ' + contact.mobile + '\n') : ('');
    (contact.telephoneNumber) ? (str += 'Phone (fix): ' + contact.telephoneNumber + '\n') : ('');
    (contact.department) ? (str += 'Department: ' + contact.department + '\n') : ('');
    (contact.jobTitle) ? (str += 'Job Title: ' + contact.jobTitle + '\n') : ('');
    (contact.mail) ? (str += 'Email: ' + contact.mail + '\n') : ('');


    var vcard = str;
    // 'FN:' + contact.name.formatted + '\n' +

    // var file = new Blob([vcard], {type: 'vsf'});

    return vcard;
  }

  openUserShare(user) {
    var vcard = this.buildVCard(user);
    SocialSharing.share(vcard, 'test', '', '');
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
