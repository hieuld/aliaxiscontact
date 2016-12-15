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

    // static authority = 'https://login.windows.net/common';
    static authority: string = 'https://login.microsoftonline.com/common/';
    static resourceUri: string = 'https://graph.microsoft.com/';

    // Devoteam
    // oud static clientId = '54d04588-2045-45f8-82e1-3d6960340840';
    // static clientId = '4861f0db-8270-4a1a-8b00-eba492ad75fe';
    // static clientSecret = '1hCKuJ2i8yhEhqv3fhJ5xk/oT0kc1Jn/0IZVoapy1jk=';
    static redirectUri: string = 'http://DevoteamContactSearcherApp';


    // DevoteamNative
    static clientId: string = 'f3d1c866-9292-4245-8bb9-9748a89c184f';

    // Aliaxis
    // static clientId = 'e788e3ca-4ef2-49e0-990b-ffcdb8236277';
    // static redirectUri = 'http://AliaxisContactSearchApp';


    static graphApiVersion: string = 'beta/';
    // static graphApiVersion = 'v1.0/';
}
