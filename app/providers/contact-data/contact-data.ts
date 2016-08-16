import { Injectable } from '@angular/core';
import { Contact, Contacts, ContactFindOptions, ContactField } from 'ionic-native';

@Injectable()
export class ContactData {
  contacts: any[];

  constructor() {}

  loadContacts(completeCallBack, failComeBack) {
    var opt = new ContactFindOptions();
    opt.filter = "";
    opt.desiredFields = ['name','emails','phoneNumbers'];
    opt.multiple = true;

    Contacts.find(['name','emails','phoneNumbers'], opt)
      .then((contacts) => {
        this.contacts = contacts;
        completeCallBack();
      })
      .catch((err) => {
        console.error(err);
        failComeBack(err);
      });
  }

  getContacts() {
    return this.contacts;
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
    phoneNumbers[0] = new ContactField('work','212-555-1234', false);
    phoneNumbers[1] = new ContactField('mobile','212-555-1234', true); //- preferred number
    //contact.phoneNumbers = phoneNumbers;

    // save the contact
    contact.save();
  }

  importUser(user) {
    console.log('import user');
    console.log(user);
  }

}
