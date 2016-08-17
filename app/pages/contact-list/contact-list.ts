import { Component } from '@angular/core';
import { ActionSheet, NavController } from 'ionic-angular';
import { ContactData } from '../../providers/contact-data/contact-data';
import { Lib } from '../../providers/lib/lib';

@Component({
  templateUrl: 'build/pages/contact-list/contact-list.html'
})
export class ContactListPage {
  actionSheet: ActionSheet;
  contacts = [];

  constructor(private nav: NavController, private contactData: ContactData) {}

  ionViewWillEnter() {
    console.log('ionViewWillEnter');
    this.contacts = this.contactData.getContacts();
  }

  ionViewDidLeave() {
    console.log('ionViewDidLeave');
  }

  doCall(contact) {

    if (!Lib.hasValue(contact)) {console.log('contact = null'); return; }
    if (!Lib.hasElementArray(contact.phoneNumbers)) {console.log('no phone number'); return; }

    var phoneNum = contact.phoneNumbers[0];
    if (!Lib.hasValue(phoneNum.value)) {console.log('no phone number'); return; }

    var num = phoneNum.value;
    console.log('calling ... ' + num);
    Lib.call(num);
  }

  doText(contact) {
    if (!Lib.hasValue(contact)) {console.log('contact = null'); return; }
    if (!Lib.hasElementArray(contact.phoneNumbers)) {console.log('no phone number'); return; }

    var phoneNum = contact.phoneNumbers[0];
    if (!Lib.hasValue(phoneNum.value)) {console.log('no phone number'); return; }

    var num = phoneNum.value;
    console.log('calling ... ' + num);
    Lib.text(num);

  }

  openUserShare(user) {
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
