import { Component } from '@angular/core';
import { ActionSheet, Loading, NavController } from 'ionic-angular';
import { SocialSharing } from 'ionic-native';
import { ContactData } from '../../providers/contact-data/contact-data';
import { Lib } from '../../providers/lib/lib';
import { DomSanitizationService  } from '@angular/platform-browser';

@Component({
  templateUrl: 'build/pages/contact-list/contact-list.html'
})
export class ContactListPage {
  actionSheet: ActionSheet;
  contacts = [];
  prevValue = '';
  savedContacts = [];

  constructor(private nav: NavController, private contactData: ContactData, private sanitizer: DomSanitizationService) { }


  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }


  ionViewWillEnter() {
    if (!this.contacts || this.contacts.length === 0 || this.contacts.length !== this.contactData.contacts.length) {
        this.contacts = [];
        let loading = Loading.create({
        content: 'Loading Contact...'
      });

      this.nav.present(loading);
      this.contactData.loadContacts(() => {
        this.contacts = this.contactData.getContacts();
        this.savedContacts = this.contacts;
        loading.dismiss();
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
  }

  searchContact(ev: any) {
    // Reset items back to all of the items
    this.contacts = this.savedContacts;
    // set val to the value of the searchbar
    let val = ev.target.value;
    // if the value is an empty string don't filter the items
    if (val && val.trim() !== '') {
      // this.contactData.findUserByName(val);
      this.contacts = this.contacts.filter((item) => {
        var name = item.displayName;
        if (name !== null && name !== ' ') {
          return (name.toLowerCase().indexOf(val.toLowerCase()) > -1);
        }
      });
    }
    this.prevValue = val;
  }

  doCall(contact) {

    if (!Lib.hasValue(contact)) { console.error('contact = null'); return; }
    if (!Lib.hasElementArray(contact.phoneNumbers)) { console.error('no phone number'); return; }

    var phoneNum = contact.phoneNumbers[0];
    if (!Lib.hasValue(phoneNum.value)) { console.error('no phone number'); return; }

    var num = phoneNum.value;
    Lib.call(num);
  }

  doText(contact) {
    if (!Lib.hasValue(contact)) { console.error('contact = null'); return; }
    if (!Lib.hasElementArray(contact.phoneNumbers)) { console.error('no phone number'); return; }

    var phoneNum = contact.phoneNumbers[0];
    if (!Lib.hasValue(phoneNum.value)) { console.error('no phone number'); return; }

    var num = phoneNum.value;
    Lib.text(num);

  }


  buildVCard(contact) {
    var str = contact.displayName + '\n';
    if (contact.phoneNumbers) {
      for (let i = 0; i < contact.phoneNumbers.length; i++) {
        str += contact.phoneNumbers[i].type + ': ' + contact.phoneNumbers[i].value + '\n';
      }
    }

    (contact.department) ? (str += 'Department: ' + contact.department + '\n') : ('');
    (contact.jobTitle) ? (str += 'Job Title: ' + contact.jobTitle + '\n') : ('');

    if (contact.emails) {
      for (let i = 0; i < contact.emails.length; i++) {
        str += contact.emails[i].type + ': ' + contact.emails[i].value + '\n';
      }
    }

    var vcard = str;
    // 'FN:' + contact.name.formatted + '\n' +

    // var file = new Blob([vcard], {type: 'vsf'});

    return vcard;
  }

  openContactShare(user) {
    var vcard = this.buildVCard(user);
    SocialSharing.share(vcard, 'test', '', '');
  }
}
