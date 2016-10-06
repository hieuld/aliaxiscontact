import { Component } from '@angular/core';
import { Events, Loading, ActionSheet, NavController, Alert } from 'ionic-angular';
import { Toast } from 'ionic-native';
import { UserData } from '../../providers/user-data/user-data';
import { ContactData } from '../../providers/contact-data/contact-data';
import { Lib } from '../../providers/lib/lib';

@Component({
  templateUrl: 'build/pages/user-list/user-list.html'
})

export class UserListPage {
  actionSheet: ActionSheet;
  users = [];
  savedUsers = [];
  prevValue = '';

  constructor(
    private nav: NavController,
    private userData: UserData,
    private contactData: ContactData,
    private events: Events
  ) { }

  ionViewWillEnter() {
    console.log('user-list ionviewWillEnter');
    if (this.users.length === 0) { this.getUsers(); }
    this.doSubscribe();
  }

  getUsers() {
    // this.users = this.userData.getUsers();
    // this.users = this.userData.getLocalUsers();
    // console.log('#users', this.users.length);
    if (this.users.length <= 0) {
      let loading = Loading.create({
        content: 'Loading Users...'
      });

      this.nav.present(loading);

      this.userData.fetchUsers(res => {
        //  console.log('users were empty, reloading them now.');
        this.users = res;
        this.savedUsers = this.users;
        console.log('res.lengt', res.length);
        Toast.show('Users have been loaded', '5000', 'center');
        loading.dismiss();
      },
        err => {
          console.error(err);
          loading.dismiss();
        }
      );
    }
  }

  ionViewDidLeave() {
    console.log('user-list ionViewDidLeave');
    this.events.unsubscribe('users:change', () => { });
  }

  doSubscribe() {
    this.events.subscribe('users:change', (userEventData) => {

      if (!Lib.hasElementArray(userEventData)) return;

      var newUsers = userEventData[0];
      var len = newUsers.length;

      (len === 0) ? (this.users.length = 0) : (this.users = newUsers);
    });
  }

  setUsers(users) {
    this.users = users;
  }

  searchUser(ev: any) {
    // Reset items back to all of the items
    this.users = this.savedUsers;
    // set val to the value of the searchbar
    let val = ev.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() !== '') {
      this.users = this.users.filter((item) => {
        //  console.log(item.displayName);
        if (item.displayName !== null) {
          return (item.displayName.toLowerCase().indexOf(val.toLowerCase()) > -1);
        }
      });
    }
    this.prevValue = val;
  }

  doImport(user) {
    console.log('doImport');
    Toast.show('Contact saved!', 'short', 'top').subscribe(
      toast => {
        //  console.log('Success', toast);
        this.contactData.importUser(user);
      },
      error => {
        console.log('Error', error);
      },
      () => {
        console.log('Completed');
      }
    );
  }

  doCall(user) {

    if (!Lib.hasValue(user)) { console.log('user = null'); return; }
    if (!Lib.hasValue(user.mobile)) { console.log('no phone number'); return; }

    console.log('calling ... ' + user.mobile);
    Lib.call(user.mobile);
  }

  doText(user) {

    if (!Lib.hasValue(user)) { console.log('user = null'); return; }
    if (!Lib.hasValue(user.mobile)) { console.log('no phone number'); return; }

    console.log('sms ... ' + user.mobile);
    Lib.text(user.mobile);
  }

  openUserShare(user) {
    let actionSheet = ActionSheet.create({
      title: 'Share ' + user.displayName,
      buttons: [
        {
          text: 'Copy Link',
          handler: () => {
            console.log('Copy link clicked on https://twitter.com/' + user.twitter);
            if (window['cordova'] && window['cordova'].plugins.clipboard) {
              window['cordova'].plugins.clipboard.copy('https://twitter.com/' + user.twitter);
            }
          }
        },
        {
          text: 'Share via ...',
          handler: () => {
            console.log('Share via clicked');
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });

    this.nav.present(actionSheet);
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
