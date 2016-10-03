import { Injectable } from '@angular/core';

@Injectable()
export class Conf {

  constructor() { throw new Error('Cannot new this class'); }

  static authority          = 'https://login.windows.net/common';
  static redirectUri        = 'http://DevoteamContactSearcherApp';
  static resourceUri        = 'https://graph.windows.net';
  static clientId           = '54d04588-2045-45f8-82e1-3d6960340840';
  static graphApiVersion    = '2013-11-08';
}
