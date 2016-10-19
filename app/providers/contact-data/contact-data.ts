import { Injectable } from '@angular/core';
import { Contact, Contacts, ContactFindOptions, File, ContactField } from 'ionic-native';
import { Lib } from '../../providers/lib/lib';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Conf } from '../conf/conf';
import { DomSanitizationService  } from '@angular/platform-browser';


@Injectable()
export class ContactData {
  contacts: any[];

  constructor(private http: Http, private sanitizer: DomSanitizationService) { }

  loadContacts(completeCallBack, failComeBack) {
    // find all contacts
    var t = { 'filter': '', 'multiple': true, 'desiredFields': ['name', 'emails', 'phoneNumbers'] };
    Contacts.find(['*'], t)
      .then((contacts) => {
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

  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  setContacts(contacts) {
    this.contacts = contacts;
    this.contacts
      .filter(x => (x.displayName !== null && x.phoneNumbers !== null))
      .sort((a, b) => {
        if (a.displayName < b.displayName) {
          return -1;
        } else if (a.displayName > b.displayName) {
          return 1;
        } else {
          return 0;
        }
      });
    // console.log('refused ' + (contacts.length - this.contacts.length) + ' contacts');

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
    var contact;
    if (test !== undefined) {
      contact = test;
      console.log('contact already exists');
      console.log(contact.phoneNumbers !== null, user.mobile !== null);
      if (/*contact.phoneNumbers !== null && */user.mobile !== null) {

        if (!contact.phoneNumbers) {
          console.log('phoneNumbers was empty');
          contact.phoneNumbers = [];
          console.log(contact.displayName, user.mobile);
          var cfMobNr = new ContactField('mobile', user.mobile);
          contact.phoneNumbers.push(cfMobNr);
          console.log(contact.displayName, user.telephoneNumber);
          var cfTelNr = new ContactField('home', user.telephoneNumber);
         contact.phoneNumbers.push(cfTelNr);
        } else {
          if (contact.phoneNumbers.filter(x => x.value.replace(' ', '') === user.mobile.replace(' ', '')).length !== 0) {
            console.log(contact.displayName, user.mobile);
            var cf = new ContactField('mobile', user.mobile);
            contact.phoneNumbers.push(cf);
          }
          if (contact.phoneNumbers.filter(x => x.value.replace(' ', '') === user.telephoneNumber.replace(' ', '')).length !== 0) {
            console.log(contact.displayName, user.telephoneNumber);
            var cf = new ContactField('home', user.telephoneNumber);
            contact.phoneNumbers.push(cf);
          }
        }
      }
    } else {
      console.log('new contact');
      contact = this.createContact(user);
    }
    contact.save().then((contact) => {
      alert('saved');
    }, (error) => {
      alert(error);
    });
    this.contacts = [];
    this.setContacts(this.getContacts());
  }

  createContact(user) {
    // console.log('contact bestaat nog niet');
    var contact = Contacts.create();
    contact.phoneNumbers = [];
    contact.organizations = [];
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
    if (user.department != null) { contact.organizations.push({ title: user.jobTitle, department: user.department }); }
    // contact.organizations.push(new ContactOrganization (user.department));
    console.log(contact.organizations[0].name);
    console.log(contact.organizations[0].department);
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
  }
}
