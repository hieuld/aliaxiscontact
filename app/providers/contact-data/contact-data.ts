import { Injectable } from '@angular/core';
import { Contact, Contacts, ContactFindOptions, File, ContactField, Diagnostic } from 'ionic-native';
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
    var t = { 'filter': '', 'multiple': true, 'hasPhoneNumber': true, 'desiredFields': ['name', 'emails', 'phoneNumbers', 'photos'] };
    Contacts.find(['*'], t)
      .then((contacts) => {
        this.setContacts(contacts);
        completeCallBack();
      })
      .catch((err) => {
        console.error('failed to load contacts');
        console.error(err);
        failComeBack(err);
      });
  }

  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  setContacts(contacts) {
    this.contacts = contacts
      .filter(x => {
        if (x.displayName === null && x.name.formatted !== null) {
          x.displayName = x.name.formatted;
        } return (x.displayName !== null && x.phoneNumbers !== null);
      })
      .sort((a, b) => {
        if (a.displayName < b.displayName) {
          return -1;
        } else if (a.displayName > b.displayName) {
          return 1;
        } else {
          return 0;
        }
      });
  }

  getContacts() {
    if (this.contacts !== undefined) {
      if (this.contacts.length > 0) {
        return this.contacts;
      }
    }
    this.loadContacts(() => {
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
        completeCallBack(contact);
      })
      .catch((err) => {
        console.error(err);
        failComeBack(err);
      });
  }

  saveContact(test, user) {
    // var contact;
    if (test !== undefined) {
      // contact = test;
      if (user.mobile !== null) {
        if (!test.phoneNumbers) {
          test.phoneNumbers = [];
          var cfMobNr = new ContactField('Mobile', user.mobile);
          test.phoneNumbers.push(cfMobNr);
          var cfTelNr = new ContactField('Home', user.telephoneNumber);
          test.phoneNumbers.push(cfTelNr);
        } else {
          if (test.phoneNumbers.filter(x => x.value.replace(' ', '') === user.mobile.replace(' ', '')).length < 0) {
            var cf = new ContactField('Mobile', user.mobile);
            test.phoneNumbers.push(cf);
          }
          if (test.phoneNumbers.filter(x => x.value.replace(' ', '') === user.telephoneNumber.replace(' ', '')).length < 0) {
            var cf = new ContactField('Home', user.telephoneNumber);
            test.phoneNumbers.push(cf);
          }
        }
      }
      if (user.mail != null) {
        if (!test.emails) {
          test.emails = [];
        }
        if (test.emails.filter(x => x.value.replace(' ', '') === user.mail.replace(' ', '')).length < 0) {
          test.emails.push(new ContactField('Work', user.mail));
        }
      }

      if (user.department != null) {
        if (!test.organizations) {
          test.organizations = [];
        }
        test.organizations.push({ type: 'Work', title: user.jobTitle, department: user.department });
      }

      if (user.photo !== undefined && user.photo !== null) {
        if (!test.photos) {
          test.photos = [];
        }
        var cf = new ContactField('base64', user.photo);
        test.photos.push(cf);
      }
      test.save().then(
        (contact) => {
          this.contacts = [];
          this.loadContacts(() =>
            this.setContacts(this.getContacts()), console.error);
        },
        (error: any) => console.error('Error saving contact.', error));

    } else {

      test = this.createContact(user);
      test.save().then(
        (contact) => {
          this.contacts = [];
          this.loadContacts(() =>
            this.setContacts(this.getContacts()), console.error);
        },
        (error: any) => console.error('Error saving contact.', error));
    }

  }

  createContact(user) {
    // return new Promise(resolve => {
    var contact = Contacts.create();
    contact.phoneNumbers = [];
    contact.organizations = [];
    contact.emails = [];
    contact.name = {};
    if (user.displayName !== null) {
      contact.displayName = user.displayName;
      contact.name.formatted = user.displayName;
      contact.name.givenName = user.givenName;
      contact.name.familyName = user.surname;
      contact.nickname = user.nickname;
    }
    if (user.mail != null) {
      contact.emails.push(new ContactField('Work', user.mail));
    }

    if (user.mobile !== null) {
      var cf = new ContactField('Mobile', user.mobile);
      contact.phoneNumbers.push(cf);
    }

    if (user.telephoneNumber !== null) {
      contact.phoneNumbers.push(new ContactField('Home', user.telephoneNumber));

    }
    if (user.department != null) {
      contact.organizations.push({ title: user.jobTitle, department: user.department });
    }

    if (user.photo !== undefined && user.photo !== null) {
      if (!contact.photos) {
        contact.photos = [];
      }
      var cf = new ContactField('base64', user.photo);
      contact.photos.push(cf);

    } else {
      // resolve();
    }
    return contact;
    // });
  }

  findUser(user) {
    for (var i = 0; i < this.contacts.length; i++) {
      if (this.contacts[i].displayName === user.displayName || this.contacts[i].name.formatted === user.givenName + ' ' + user.surname) {
        return this.contacts[i];
      }
    }
  }

  findUserByName(userName) {
    for (var i = 0; i < this.contacts.length; i++) {
      if (this.contacts[i].displayName.toLowerCase().indexOf(userName.toLowerCase()) > -1) {
        // if (this.contacts[i].displayName === userName) {
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
