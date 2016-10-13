import { Component } from '@angular/core';
import { Events, Loading, ActionSheet, NavController, Alert } from 'ionic-angular';
import { Toast, SocialSharing } from 'ionic-native';
import { UserData } from '../../providers/user-data/user-data';
import { ContactData } from '../../providers/contact-data/contact-data';
import { Lib } from '../../providers/lib/lib';
// import { vcardsjs } from '../vcards-js';

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
    if (this.users.length <= 0) {
      // this.users = this.userData.getLocalUsers();
      // this.users =
      this.userData.getUsers(this.nav);
      this.savedUsers = this.users;
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
    // this.users = [];
    // var count = 0;
    // for (var i = 0; i < users.length; i++) {
    //   if (users[i].displayName !== '' && users[i].mail !== '' && users[i].mobile !== ''/* ||  users[i].telephoneNumber !== '')*/) {
    //     this.users.push(users[i]);
    //   } else {
    //     count++;
    //     console.log(i, 'name', users[i].displayName, 'mail', users[i].mail, 'mobile', users[i].mobile, 'phone', users[i].telephoneNumber);
    //   }
    // }
    // console.log('refused ', count, 'users');
  }

  searchUser(ev: any) {
    // Reset items back to all of the items
    if (this.savedUsers.length === 0) {
      this.savedUsers = this.users;
    }
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
    Toast.show('Contact saved!', 'medium', 'top').subscribe(
      toast => {
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

  buildVCard(contact) {
    console.log('Contact', contact);
    var str = contact.displayName + '\n';
    (contact.mobile) ? (str += 'Mobile: ' + contact.mobile + '\n') : ('');
    (contact.telephoneNumber) ? (str += 'Phone (fix): ' + contact.telephoneNumber + '\n') : ('');
    (contact.department) ? (str += 'Department: ' + contact.department + '\n') : ('');
    (contact.jobTitle) ? (str += 'Job Title: ' + contact.jobTitle + '\n') : ('');
    (contact.mail) ? (str += 'Email: ' + contact.mail + '\n') : ('');


    var vcard = str;
    // 'FN:' + contact.name.formatted + '\n' +

    console.log(vcard);
    // var file = new Blob([vcard], {type: 'vsf'});

    return vcard;
  }

  openUserShare(user) {
    var vcard = this.buildVCard(user);
    SocialSharing.share(vcard, 'test', '', '');
    /*
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
        }, {
          text: 'Share ContactCard',
          handler: () => {
            console.log('Share via clicked');
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

    this.nav.present(actionSheet);*/
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
