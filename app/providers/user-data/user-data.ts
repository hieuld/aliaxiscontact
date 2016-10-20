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
  userThumbs = {};
  auth: any;
  nextLink = '';
  url = '';

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

  checkUsers(users) {
    var returnValues = [];
    for (var i = 0; i < users.length; i++) {
      // for (var j = 0; j < 16200; j++) {
      // var i = 2;
      if (users[i]) {
        if (users[i].mail !== null && (users[i].mobile !== null || users[i].telephoneNumber !== null)) {
          this.users.push(users[i]);
        }
      }
    }
    // return returnValues;
  }

  setUsers(users) {
    this.users = [];
    this.checkUsers(users);
    console.log('refused ' + (users.length - this.users.length) + ' users');
    this.events.publish('users:change', this.users);
  }

  getUsers(nav) {
    this.getUserThumbs();
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
        ).then(() => {
          this.getOnlineUsers();
        })
        .then(() => {
          loading.dismiss();
        }).then(() => this.cacheUserThumbs());
    }
  }

  getUserThumbs() {

    NativeStorage.getItem('userThumbs').then((data) => {
      this.userThumbs = data;
      console.log('data', Object.keys(data).length);
    });

  }

  cacheUserThumbs() {
    if (Object.keys(this.userThumbs).length > 2) {
      console.log(this.userThumbs);
      NativeStorage.setItem('userThumbs', this.userThumbs);
    }
  }

  getOnlineUsers() {
    return new Promise(resolve => {
      if (navigator.connection.type !== 'none') {
        console.log('getting online contacts.');
        this.fetchUsers(() => {
          console.log('Successfully loaded online contacts.');
          if (this.users.length !== 0) {
            NativeStorage.setItem('users', this.users);
          }
          resolve();
        },
          err => {
            console.error(err);
            resolve();
          });
      } else {
        resolve();
      }
    });
  }

  fetchUsersWithAuth(auth, completeCallBack, failCallBack) {
    if (navigator.connection.type !== 'none') {
      this.url = Conf.resourceUri + '/' + auth.tenantId + '/users?$top=100&api-version=' + Conf.graphApiVersion;
      var values = [];
      var hed: Headers = new Headers();
      hed.set('Content-type', 'application/json');
      hed.append('Authorization', 'Bearer ' + auth.accessToken);
      var opt: RequestOptions = new RequestOptions({ headers: hed });
      this.http.get(this.url, opt).map((res: Response) => {
        return res.json();
      }).subscribe(
        data => {
          values = data.value;
          if (data['odata.nextLink']) {
            this.nextLink = data['odata.nextLink'];
          }
          completeCallBack(values);
        },
        err => {
          console.error(err);
          failCallBack(err);
        },
        () => { }
        );
    }
  }

  findUser(val, searchtType) {
    if (navigator.connection.type !== 'none') {
      var query = '&$filter=startswith(' + searchtType + ',\'' + val + '\')';
      if (searchtType === 'displayName') {
        query += ' or startswith(surname,\'' + val + '\')';
      }
      this.url = Conf.resourceUri + '/' + this.auth.tenantId + '/users?api-version=' + Conf.graphApiVersion + query;
      var values = [];
      var hed: Headers = new Headers();
      hed.set('Content-type', 'application/json');
      hed.append('Authorization', 'Bearer ' + this.auth.accessToken);
      var opt: RequestOptions = new RequestOptions({ headers: hed });
      this.http.get(this.url, opt).map((res: Response) => {
        return res.json();
      }).subscribe(
        data => {
          values = data.value;
          this.setUsers(values);
          if (data['odata.nextLink']) {
            this.nextLink = data['odata.nextLink'];
          }
        },
        err => {
          console.error(err);
        },
        () => { }
        );
    }
  }

  getNextPage(infiniteScroll) {
    if (this.nextLink !== '') {
      var skiptoken = this.nextLink.substring(this.nextLink.search('skiptoken') + 12, this.nextLink.length - 1);
      skiptoken = '\'' + skiptoken + '\'';
      var newUrl = this.url + '&$skiptoken=X' + skiptoken;

      var hed: Headers = new Headers();
      hed.set('Content-type', 'application/json');
      hed.append('Authorization', 'Bearer ' + this.auth.accessToken);
      var opt: RequestOptions = new RequestOptions({ headers: hed });
      this.http.get(newUrl, opt).map((res: Response) => {
        return res.json();
      })
        .subscribe(data => {
          infiniteScroll.complete();
          console.log('this.users.length', this.users.length);
          this.checkUsers(data.value);
          console.log('this.users.length', this.users.length);
          if (data['odata.nextLink']) {
            this.nextLink = data['odata.nextLink'];
          } else {
            this.nextLink = '';
          }
        }
        ,
        err => {
          console.error(err);
        },
        () => { }
        );
    } else {
      infiniteScroll.complete();
    }
  }

  fetchProfilePicture(auth) {
    if (navigator.connection.type !== 'none') {
      this.fetchProfilePictureById(auth.userInfo.uniqueId, true);
    }
  }

  updateUserThumbs() {
    if (navigator.connection.type !== 'none') {
      for (var i = 0; i < this.users.length; i++) {
        var id = this.users[i].userPrincipalName;
        if (this.users[i]['thumbnailPhoto@odata.mediaContentType']) {
          if (!this.userThumbs[id]) {
            this.fetchProfilePictureById(id, false);
          } else { console.log('already cached', id); }
        }
      };
    }
  }

  fetchProfilePictureById(id, isUser) {
    if (!this.userThumbs[id]) {
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
          if (oReq.status !== 404) {
            if (isUser) {
              this.profilepic = reader.result;
            }
            this.userThumbs[id] = reader.result;
            console.log(id);
          } else {
            console.log('no picture for', id);
          }
        };
      };
      oReq.onerror = () => {
        console.log('404', id);
      };
      oReq.send();
    }
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
    NativeStorage.clear();
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
