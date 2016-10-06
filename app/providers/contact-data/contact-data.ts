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
        this.setContacts(contacts);
        console.log('successfully loaded contacts ...........');
        completeCallBack();
      })
      .catch((err) => {
        console.log('failed to load contacts');
        console.error(err);
        failComeBack(err);
      });
  }

  setContacts(contacts) {
    console.log(contacts[0].displayName);
    this.contacts = contacts.sort((n1, n2) => n1.displayName - n2.displayName);
    console.log(this.contacts[0].displayName);
// this.contacts = contacts;
  }

  getContacts() {
    if (this.contacts !== undefined) {
      console.log('#contacts', this.contacts.length);
      if (this.contacts.length > 0) {
        return this.contacts;
      }
    }
    this.loadContacts(() => {
      console.log('contacts were empty, reloading them now.');
      return this.contacts;
    },
      err => {
        console.error(err);
      }
    );
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

  saveContact(test, user) {

    if (test !== undefined) {
      console.log('contact already exists');
    } else {
      console.log('new contact');
      var contact = this.createContact(user);
      contact.save().then((contact) => {
        alert('saved');
      }, (error) => {
        alert(error);
      });
      this.contacts = [];
      this.setContacts(this.getContacts());
    }

  }

  createContact(user) {
    // console.log('contact bestaat nog niet');
    var contact = Contacts.create();
    contact.phoneNumbers = [];
    // contact.organizations = [];
    contact.emails = [];
    if (user.displayName !== null) {
      contact.displayName = user.displayName;
    }
    if (user.mail != null) {
      contact.emails.push(new ContactField('work', user.mail));
    }

    if (user.mobile !== null) {
      var cf = new ContactField('mobile', user.mobile);
      contact.phoneNumbers.push(cf);
    }

    if (user.telephoneNumber !== null) {
      contact.phoneNumbers.push(new ContactField('home', user.telephoneNumber));

    }
    //  if (user.department != null) { contact.organizations = user.department; }
    // contact.organizations.push(new ContactOrganization (user.department));

    return contact;
  }

  findUser(user) {
    for (var i = 0; i < this.contacts.length; i++) {
      if (this.contacts[i].displayName === user.displayName) {
        console.log(this.contacts[i].displayName);
        return this.contacts[i];
      }
    }
  }

  importUser(user) {
    var contact;
    if (this.contacts !== undefined) {
      this.setContacts(this.getContacts());
      test = this.findUser(user);
      this.saveContact(test, user);

    } else {
      var test;
      console.log('contacts was undefined, loading them now.');
      this.loadContacts(() => {
        test = this.findUser(user);
        this.saveContact(test, user);
      },
        err => {
          console.error(err);
        }
      );
    }



    // var test = this.contacts.some(x=> x.displayName === user.displayName);
    // console.log('-----------------------------------------------------', test);

    // var test = this.contacts.find(test => test.displayName = user.displayName);
    // console.log(test.displayName);

    // var options = new ContactFindOptions();
    // options.filter = user.displayName;
    // options.multiple = false;
    // options.desiredFields = ['displayName'];
    // options.hasPhoneNumber = true;
    // var fields = ['displayName'];

    //  Contacts.find(fields, options).then((test) => {
    // console.log(contacts);

    // if (user.displayName && user.displayName.trim() !== '') {
    //   var test = this.contacts.find((item) => {
    //     //  console.log(item.displayName);
    //     if (item.displayName !== null) {
    //       return (item.displayName.toLowerCase().indexOf(user.displayName.toLowerCase()) > -1);
    //     }
    //   });
    // }

  }
}
