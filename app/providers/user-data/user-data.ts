import { Injectable } from '@angular/core';
import { Events, LocalStorage, Storage, Loading } from 'ionic-angular';
import { NativeStorage } from 'ionic-native';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Conf } from '../conf/conf';
import 'rxjs/add/operator/map';

declare var Microsoft: any;
declare var navigator: any;
declare function escape(s: string): string;


@Injectable()
export class UserData {
  storage = new Storage(LocalStorage);
  users = [];
  profilepic = {};
  auth: any;
  constructor(private events: Events, private http: Http) { }

  getAuth(completeCallBack, failCallBack) {

    var context = new Microsoft.ADAL.AuthenticationContext(Conf.authority);
    context.tokenCache.readItems().then(items => {
      // - Attem to get from the cache
      if (items.length > 0) {
        var authority = items[0].authority;
        context = new Microsoft.ADAL.AuthenticationContext(authority);
      }

      // - Attempt to authorize user silently
      context.acquireTokenSilentAsync(Conf.resourceUri, Conf.clientId)
        .then(completeCallBack, failCallBack);
    });
  }

  login(completeCallBack, failCallBack) {

    this.authenticate(
      auth => {
        this.auth = auth;
        var username = auth.userInfo.displayableId;
        this.setUsername(username);
        this.events.publish('user:login');
        this.fetchProfilePicture(auth);
      },
      failCallBack
    );

  }

  logout(completeCallBack, failCallBack) {
    this.users = [];
    this.clearCache(
      () => {
        this.storage.remove('username');
        NativeStorage.clear();
        this.events.publish('user:logout');
        this.setUsers([]);
        completeCallBack();
      },
      failCallBack
    );
  }

  setUsers(users) {
    // var count = 0;
    this.users = [];
    for (var i = 0; i < users.length; i++) {
      if (users[i].mail !== null && (users[i].mobile !== null || users[i].telephoneNumber !== null)) {
        this.users.push(users[i]);
      }
    }
    console.log('first user', this.users[0]);
    console.log('refused ' + (users.length - this.users.length) + ' users');
    this.events.publish('users:change', this.users);
  }

  getUsers(nav) {
    if (this.users.length !== 0) {
      return this.users;
    } else {
      let loading = Loading.create({
        content: 'Loading Users...'
      });
      nav.present(loading);
      NativeStorage.getItem('users')
        .then(
        (data) => {
          this.setUsers(data);
          loading.dismiss();
          console.log('local loaded');
        },
        (error) => {
          console.error(error);
          return Promise.resolve();
        }
        ).then(() => this.getOnlineUsers())
        .then(() => loading.dismiss());
    }
  }

  getOnlineUsers() {
    return new Promise(resolve => {
      if (navigator.connection.type !== 'none') {
        console.log('getting online contacts.');
        this.fetchUsers(() => {
          console.log('Successfully loaded online contacts.');
          NativeStorage.setItem('users', this.users);
          resolve();
        },
          err => {
            console.error(err);
            resolve();
          });
      }
    });
  }

  updateUserThumbs() {
    for (var i = 0; i < this.users.length; i++) {
      this.fetchProfilePictureById(this.users[i].userPrincipalName, false);
    }
  }

  fetchUsersWithAuth(auth, completeCallBack, failCallBack) {
    var url = Conf.resourceUri + '/' + auth.tenantId + '/users?$top=100&api-version=' + Conf.graphApiVersion;
    var values = [];
    var hed: Headers = new Headers();
    hed.set('Content-type', 'application/json');
    hed.append('Authorization', 'Bearer ' + auth.accessToken);
    var opt: RequestOptions = new RequestOptions({ headers: hed });
    this.http.get(url, opt).map((res: Response) => {
      return res.json();
    }).subscribe(
      data => {
        values = values.concat(data.value);
        if (data['odata.nextLink']) {
          this.getNextPage(url, data['odata.nextLink'], auth, values, completeCallBack);
        } else {
          completeCallBack(values);
        }
        // console.log(values.length);
      },
      err => {
        console.error(err);
        failCallBack(err);
      },
      () => { }
      );
  }

  getNextPage(url, nextLink, auth, values, completeCallBack) {
    var skiptoken = nextLink.substring(nextLink.search('skiptoken') + 12, nextLink.length - 1);
    skiptoken = '\'' + skiptoken + '\'';
    // skiptoken = escape(skiptoken);
    var newUrl = url + '&$skiptoken=X' + skiptoken;

    // console.log('url', newUrl);
    var hed: Headers = new Headers();
    hed.set('Content-type', 'application/json');
    hed.append('Authorization', 'Bearer ' + auth.accessToken);
    var opt: RequestOptions = new RequestOptions({ headers: hed });
    this.http.get(newUrl, opt).map((res: Response) => {
      return res.json();
    })
      .subscribe(data => {
        values = values.concat(data.value);
        console.log(values.length);
        if (data['odata.nextLink']) {
          this.getNextPage(url, data['odata.nextLink'], auth, values, completeCallBack);
        } else {
          completeCallBack(values);
        }
        return data;
      }
      ,
      err => {
        console.error(err);
        completeCallBack(values);
      },
      () => { }
      );
  }

  fetchProfilePicture(auth) {
    this.fetchProfilePictureById(auth.userInfo.uniqueId, true);
  }

  fetchProfilePictureById(id, isUser) {
    var url = Conf.resourceUri + '/' + this.auth.tenantId + '/users/' + id + '/thumbnailPhoto?api-version=' + Conf.graphApiVersion;
    var oReq = new XMLHttpRequest();
    oReq.open('GET', url, true);
    oReq.setRequestHeader('Content-type', 'image/jpeg');
    oReq.setRequestHeader('Authorization', 'Bearer ' + this.auth.accessToken);
    oReq.responseType = 'arraybuffer';

    oReq.onload = (oEvent) => {
      var blob = new Blob([oReq.response], { type: 'image/jpg' });
      var reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        if (isUser) {
          this.profilepic = reader.result;
        } else {
          // console.log(id);
          var i = this.users.findIndex(x => x.userPrincipalName === id);
          var u = this.users[i];
          u.photo = reader.result;
          this.users[i] = u;
          if (i === this.users.length - 1) {
            this.setUsers(this.users);
          }
        }
      };
    };
    oReq.onerror = () => {
      console.log('no picture for', id);
    }
    oReq.send();
  }

  fetchUsers(completeCallBack, failCallBack) {
    var t0 = performance.now();
    var t1 = 0;
    this.getAuth(
      auth => {
        this.fetchUsersWithAuth(
          auth,
          users => {
            t1 = performance.now();
            console.log('Call to fetchusers took ' + (t1 - t0) / 1000 + ' seconds.');
            this.setUsers(users);
            completeCallBack(users);
          },
          failCallBack
        );
      },
      failCallBack
    );
  }

  clearCache(completeCallBack, failCallBack) {

    var context = new Microsoft.ADAL.AuthenticationContext(Conf.authority);
    context.tokenCache.clear().then(
      completeCallBack,
      err => {
        console.log('Failed to clear cache: ' + err);
        failCallBack(err);
      }
    );
  }

  setUsername(username) {
    this.storage.set('username', username);
  }

  getUsername() {
    return this.storage.get('username').then(value => {
      return value;
    });
  }

  authenticate(completeCallBack, failCallBack) {

    this.getAuth(completeCallBack,
      err => {
        var context = new Microsoft.ADAL.AuthenticationContext(Conf.authority);
        // - We require user cridentials so triggers authentication dialog
        context.acquireTokenAsync(Conf.resourceUri, Conf.clientId, Conf.redirectUri)
          .then(completeCallBack, failCallBack);
      }
    );
  }
}
