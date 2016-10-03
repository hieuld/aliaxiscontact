import { Injectable } from '@angular/core';
import { Contact, Contacts, ContactFindOptions, ContactField } from 'ionic-native';
import { Lib } from '../../providers/lib/lib';

@Injectable()
export class ContactData {
  contacts: any[];

  constructor() { }

  loadContacts(completeCallBack, failComeBack) {
    var opt = new ContactFindOptions();
    opt.filter = '';
    opt.desiredFields = ['name', 'emails', 'phoneNumbers'];
    opt.multiple = true;

    Contacts.find(['name', 'emails', 'phoneNumbers'], opt)
      .then((contacts) => {
        // console.log(contacts);
        // for (var i = 0; i < contacts.length; i++) {
        //   var c = contacts[i];
        //   if (Lib.hasElementArray(c.photos)) {
        //     console.log('photos = ' + c.photos[0].value);
        //   }
        // }
        this.contacts = contacts;
        console.log('successfully loaded contacts ...........');
        completeCallBack();
      })
      .catch((err) => {
        console.log('failed to load contacts');
        console.error(err);
        failComeBack(err);
      });
  }

  getContacts() {
    if (this.contacts.length > 0) {
      return this.contacts;
    } else {
      this.loadContacts(() => {
        console.log('contacts were empty, reloading them now.');
      },
        err => {
          console.error(err);
        }
      );
    }
  }

  pickupAContact(completeCallBack, failComeBack) {
    Contacts.pickContact()
      .then((contact) => {
        console.log(contact);
        completeCallBack(contact);
      })
      .catch((err) => {
        console.error(err);
        failComeBack(err);
      });
  }

  saveContact() {
    // create a new contact
    var contact = Contacts.create();
    var phoneNumbers = [];
    phoneNumbers[0] = new ContactField('work', '212-555-1234', false);
    phoneNumbers[1] = new ContactField('mobile', '212-555-1234', true);
    // - preferred number
    // contact.phoneNumbers = phoneNumbers;

    // save the contact
    contact.save();
  }

  importUser(user) {
    console.log('import user');
    console.log(user);
  }

}
