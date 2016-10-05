import { Component } from '@angular/core';
import { ActionSheet, Loading, NavController } from 'ionic-angular';
import { ContactData } from '../../providers/contact-data/contact-data';
import { Lib } from '../../providers/lib/lib';

@Component({
  templateUrl: 'build/pages/contact-list/contact-list.html'
})
export class ContactListPage {
  actionSheet: ActionSheet;
  contacts = [];

  constructor(private nav: NavController, private contactData: ContactData) { }

  ionViewWillEnter() {
    console.log('Contact-list ionViewWillEnter');
    // console.log('contactData.contacts.length', this.contactData.contacts.length);
    // this.contacts = this.contactData.getContacts();
    if (this.contacts.length === 0) {
      var t0 = performance.now();
      let loading = Loading.create({
        content: 'Loading Contact...'
      });

      this.nav.present(loading);
      var t1 = 0;
      this.contactData.loadContacts(() => {
        console.log('contacts were empty, reloading them now.');
        this.contacts = this.contactData.getContacts();
        loading.dismiss();
        t1 = performance.now();
        console.log('Call to loadcontacts took ' + (t1 - t0) / 1000 + ' seconds.');
      }
        ,
        err => {
          console.error(err);
          loading.dismiss();
        }

      );
    }
  }

  ionViewDidLeave() {
    console.log('Contact-list ionViewDidLeave');
  }

  doCall(contact) {

    if (!Lib.hasValue(contact)) { console.log('contact = null'); return; }
    if (!Lib.hasElementArray(contact.phoneNumbers)) { console.log('no phone number'); return; }

    var phoneNum = contact.phoneNumbers[0];
    if (!Lib.hasValue(phoneNum.value)) { console.log('no phone number'); return; }

    var num = phoneNum.value;
    console.log('calling ... ' + num);
    Lib.call(num);
  }

  doText(contact) {
    if (!Lib.hasValue(contact)) { console.log('contact = null'); return; }
    if (!Lib.hasElementArray(contact.phoneNumbers)) { console.log('no phone number'); return; }

    var phoneNum = contact.phoneNumbers[0];
    if (!Lib.hasValue(phoneNum.value)) { console.log('no phone number'); return; }

    var num = phoneNum.value;
    console.log('calling ... ' + num);
    Lib.text(num);

  }

  openContactShare(user) {
    let actionSheet = ActionSheet.create({
      title: 'Share ' + user.name,
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
}
