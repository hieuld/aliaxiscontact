import { Injectable } from '@angular/core';

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
    window.open('tel:' + num, '_system');
  }

  static text(num) {
    window.open('sms:' + num, '_system');
  }
}
