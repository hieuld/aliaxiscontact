import { Injectable } from '@angular/core';

@Injectable()
export class Conf {

  constructor() { throw new Error("Cannot new this class"); }

  static authority          = "https://login.windows.net/common";
  static redirectUri        = "http://MyDirectorySearcherApp";
  static resourceUri        = "https://graph.windows.net";
  static clientId           = "a24547d5-1611-48a6-8ba3-9773c9fcab10";
  static graphApiVersion    = "2013-11-08";
}
