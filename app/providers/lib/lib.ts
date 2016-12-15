import { Injectable } from '@angular/core';
import { Toast, SocialSharing, SMS, CallNumber } from 'ionic-native';

@Injectable()
export class Lib {

  constructor() { throw new Error('Cannot new this class'); }

  static hasValue(obj) {
    return obj && obj !== 'null' && obj !== 'undefined';
  }

  static isArray(arr) {
    return this.hasValue(arr) && arr instanceof Array;
  }

  static hasElementArray(arr) {

    return this.isArray(arr) && arr.length > 0;
  }

  static call(num) {
    CallNumber.callNumber(num, false);
  }

  static text(num, message) {
    SMS.send(num, '', { android: { intent: 'INTENT' } });
  }

  static share(user, title, photo, url) {
    SocialSharing.share(user, title, photo, url);
  }
}
