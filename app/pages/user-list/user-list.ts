import { Component } from '@angular/core';
import { Events, Loading, NavController, Alert, Platform } from 'ionic-angular';
import { Toast, SocialSharing, SMS, Network, CallNumber, Keyboard } from 'ionic-native';
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
  prevValue = '';
  search = 'Name';
  searchValue = '';
  cancelled = false;
  loading: Loading;

  constructor(
    private nav: NavController,
    private userData: UserData,
    private contactData: ContactData,
    private events: Events,
    private platform: Platform
  ) { }

  sanitize(url: string) {
    return this.userData[url];
  }

  ionViewWillEnter() {
    this.users = this.userData.users;
  }

  ionViewDidEnter() {
    this.doSubscribe();
    if (this.users.length === 0) {
      this.loading = Loading.create({
        content: 'Loading users...',
        dismissOnPageChange: true
      });
      this.nav.present(this.loading);
    }
  }

  getUsers() {
    console.log('UL: GETUSERS');

    if (this.userData.users.length <= 0) {
      this.setUsers(this.userData.getUsers());
    }
    this.savedUsers = this.users;
    this.userData.getUserThumbs();
    this.userThumbs = this.userData.userThumbs;
  }

  getNextPage(infiniteScroll) {
    console.log('UL: GETNEXTPAGE');

    this.userData.getNextPage(infiniteScroll);
    this.updateUserThumbs();
  }

  updateUserThumbs() {
    console.log('UL: UPDATEUSERTHUMBS');

    this.userData.updateUserThumbs();
    this.userThumbs = this.userData.userThumbs;
  }

  ionViewDidLeave() {
    console.log('UL:IONVIEWDIDLEAVE');
    this.userData.cacheUserThumbs();
    console.log('viewDidLeave dismissed page');
    this.doUnsubscribe();
  }

  doUnsubscribe() {
    console.log('UL:DOUNSUBSCRIBE');
    this.events.unsubscribe('users:change', () => { });
    console.log('UL:DOUNSUBSCRIBEFETCHING');
    this.events.unsubscribe('fetching', () => { });
  }

  doSubscribe() {
    console.log('UL: DOSUBSCRIBE');

    this.events.subscribe('users:change', (userEventData) => {
      if (!Lib.hasElementArray(userEventData)) return;
      if (this.users.length === 0) {
      }
      var newUsers = userEventData[0];
      var len = newUsers.length;

      (len === 0) ? (this.users.length = 0) : (this.setUsers(newUsers));
      this.updateUserThumbs();
      this.savedUsers = newUsers;
    });

    console.log('UL: DOSUBSCRIBEFETCHEVENT');
    this.events.subscribe('fetching', (fetchEvent) => {
      if (!Lib.hasElementArray(fetchEvent)) return;
      let fetching = fetchEvent[0];
      if (fetching) {
        // if (this.users.length === 0) {
        //   if (this.loading === undefined) {
        console.log('fetchEvent received true');
        //     console.log('loading:before');
        //     this.loading = Loading.create({
        //       content: 'Loading users...',
        //       dismissOnPageChange: true
        //     });
        //     this.nav.present(this.loading);
        //   }
        // }
      } else {
        console.log('fetchEvent dismiss loader');
        this.loading.dismiss();
      }
    });

    console.log('UL: DOSUBSCRIBELOGOUT');
    this.events.subscribe('user:logout', () => {
      this.doUnsubscribe();
      console.log('fetchEvent dismiss loader');
      this.loading.dismiss();
    });

    console.log('UL: DOSUBSCRIBEINITIALLOGIN');
    this.events.subscribe('user:initialLogin', () => {
      console.log('initialLogin');
      this.loading = Loading.create({
        content: 'Loading users...',
        dismissOnPageChange: true
      });
      this.nav.present(this.loading);
    });

  }

  setUsers(users) {
    console.log('UL: SETUSERS');
    this.users = this.userData.users;
  }

  hideKeyboard() {
    Keyboard.close();
  }

  searchUser(ev: any) {
    console.log('UL: SEARCHUSER');

    // Reset items back to all of the items
    if (!this.savedUsers || this.savedUsers.length === 0) {
      this.savedUsers = this.users;
    }
    this.users = this.savedUsers;
    // set val to the value of the rchbar
    var val = ev.target.value;
    var searchType;

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
      this.userData.fetchUsers(() => {
        this.users = this.userData.users;
        this.savedUsers = this.userData.users;
      }
        , console.error);
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
    CallNumber.callNumber(user.mobile, false);
  }

  doText(user) {
    SMS.send(user.mobile, '');
    // if (!Lib.hasValue(user)) { console.error('user = null'); return; }
    // if (!Lib.hasValue(user.mobile)) { console.error('no phone number'); return; }
    // Lib.text(user.mobile);

  }

  buildVCard(contact) {
    var str = contact.displayName + '\n';
    (contact.mobilePhone) ? (str += 'Mobile: ' + contact.mobilePhone + '\n') : ('');
    (contact.businessPhones[0]) ? (str += 'Business Phone: ' + contact.businessPhones[0] + '\n') : ('');
    (contact.department) ? (str += 'Department: ' + contact.department + '\n') : ('');
    (contact.jobTitle) ? (str += 'Job Title: ' + contact.jobTitle + '\n') : ('');
    (contact.mail) ? (str += 'Email: ' + contact.mail + '\n') : ('');
    (contact.thumbnail) ? (str += contact.thumbnail + '\n') : ('');
    var vcard = str;
    // 'FN:' + contact.name.formatted + '\n' +
    // var file = new Blob([vcard], {type: 'vsf'});
    return vcard;
  }

  openUserShare(user) {
    var vcard = this.buildVCard(user);
    SocialSharing.share(vcard, '', this.userThumbs[user.userPrincipalName], '');
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
