import { Injectable } from '@angular/core';
import {NavController, Alert, Platform} from 'ionic-angular';

declare var navigator: any;
declare var Connection: any;

@Injectable()
export class Conf {

  constructor() {
    if (navigator.connection.type === Connection.NONE) {
      alert('test'); console.error('no inet');
    }
    throw new Error('Cannot new this class');
  }

  static authority = 'https://login.windows.net/common';
  static redirectUri = 'http://DevoteamContactSearcherApp';
  static resourceUri = 'https://graph.windows.net';
  static clientId = '54d04588-2045-45f8-82e1-3d6960340840';
  static graphApiVersion = '2013-11-08';
}
