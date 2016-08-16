import { Injectable } from '@angular/core';

@Injectable()
export class Lib {

  constructor() { throw new Error("Cannot new this class"); }

  static hasValue(obj) {
    return obj && obj !== 'null' && obj !== 'undefined';
  }

  /*
  static call(phoneNumber) {
    window.location(phoneNumber);
  }
  */
}
