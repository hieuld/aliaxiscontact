import { Injectable } from '@angular/core';
import { NavController, Alert, Platform } from 'ionic-angular';
import { Network } from 'ionic-native';


declare var navigator: any;
declare var Connection: any;

@Injectable()
export class Conf {

    constructor() {
        if (Network.connection === Connection.NONE) {
            alert('test'); console.error('no inet');
        }
        throw new Error('Cannot new this class');
    }

    static authority = 'https://login.windows.net/common';
    static resourceUri = 'https://graph.microsoft.com';
    // Devoteam
    // static clientId = '54d04588-2045-45f8-82e1-3d6960340840';
    // static redirectUri = 'http://DevoteamContactSearcherApp';
    // Aliaxis
    static clientId = 'e788e3ca-4ef2-49e0-990b-ffcdb8236277';
    static redirectUri = 'http://AliaxisContactSearchApp';


    static graphApiVersion = 'v1.0';
}
