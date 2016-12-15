import { Injectable, NgZone } from '@angular/core';
import { Events } from 'ionic-angular';
import { NativeStorage, Network, Keyboard, HTTP } from 'ionic-native';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Conf } from '../conf/conf';
import 'rxjs/add/operator/map';

declare var Microsoft: any;
declare var WindowsAzure: any;
declare var navigator: any;
declare function escape(s: string): string;


@Injectable()
export class UserData {
  users = [];
  cachedUsers = [];
  savedUsers = [];
  profilepic = {};
  userThumbs = {};
  auth: Microsoft.ADAL.AuthenticationResult;
  nextLink: string = '';
  url: string = '';
  startpoint: number = 0;
  begin: number = 0;
  end: number = 0;

  constructor(private events: Events, private http: Http, private zone: NgZone) { }

  login2() {
    let ctrl = this;
    let authContext = new Microsoft.ADAL.AuthenticationContext('https://login.microsoftonline.com/common');
    authContext.acquireTokenAsync(Conf.resourceUri,
      Conf.clientId, Conf.redirectUri)
      .then(function (result: Microsoft.ADAL.AuthenticationResult) {
        console.log('id', result.userInfo.displayableId);
        ctrl.zone.run(() => {
          // call the graph
          // ctrl.http.get('https://outlook.office.com/api/v2.0/me/contacts', {
          // ctrl.http.get(Conf.resourceUri, {
          //   headers: new Headers({ 'Authorization': 'Bearer ' + result.accessToken })
          // }).subscribe(res => { 
          //   console.log('res', res);
          //   if (res.status === 200)
          //     ctrl.users = res.json().value;
          // });
          this.setUsername(result.userInfo.displayableId);
          this.events.publish('user:login');
          this.fetchUsersWithAuth(result,
            values => {
              this.setUsers(values);
              this.savedUsers = this.users.slice();
            }, err => { console.log(err); }
          );
        });
      });
  }

  getAuth(completeCallBack, failCallBack) {

    let authContext = new Microsoft.ADAL.AuthenticationContext(Conf.authority);
    authContext.tokenCache.readItems().then(items => {
      // - Attem to get from the cache
      if (items.length > 0) {
        var authority = items[0].authority;


        authContext = new Microsoft.ADAL.AuthenticationContext(authority);
        this.auth = authContext;
        // - Attempt to authorize user silently
        authContext.acquireTokenSilentAsync(Conf.resourceUri, Conf.clientId)
          .then(completeCallBack, () => {
            authContext = new Microsoft.ADAL.AuthenticationContext(Conf.authority);
            authContext.acquireTokenAsync(Conf.resourceUri, Conf.clientId, Conf.redirectUri, 'arne.herbots@devoteam.be')
              .then(completeCallBack, failCallBack);
          });
      } else {
        this.events.publish('user:initialLogin');
        authContext = new Microsoft.ADAL.AuthenticationContext(Conf.authority);
        this.auth = authContext;
        // - We require user cridentials so triggers authentication dialog
        authContext.acquireTokenAsync(Conf.resourceUri, Conf.clientId, Conf.redirectUri, 'arne.herbots@devoteam.be')
          .then(completeCallBack, failCallBack);
      }
      // - Attempt to authorize user
      // authContext.acquireTokenAsync(Conf.resourceUri, Conf.clientId, Conf.redirectUri).then(completeCallBack, failCallBack);

      //   // - Attempt to authorize user silently
      //   authContext.acquireTokenSilentAsync(Conf.resourceUri, Conf.clientId)
      //     .then(completeCallBack, failCallBack);
    });
  }

  login(completeCallBack, failCallBack) {

    this.getAuth(
      (auth: Microsoft.ADAL.AuthenticationResult) => {
        console.log('login succes');
        this.auth = auth;
        var username = auth.userInfo.displayableId;
        this.setUsername(username);
        this.events.publish('user:login');
        this.fetchUsersWithAuth(auth,
          values => {
            this.setUsers(values);
            this.savedUsers = this.users.slice();
          },
          err => {
            console.log('login faild');
            console.error(err);
          });
      },
      error => {
        console.log('get auth failed');
        console.error(error);
        failCallBack();
      });
  }

  logout(completeCallBack, failCallBack) {

    this.users = [];
    var url = Conf.authority + 'oauth2/logout';

    var oReq = new XMLHttpRequest();
    oReq.open('GET', url, true);
    oReq.setRequestHeader('Content-type', 'application/json');
    oReq.setRequestHeader('Authorization', 'Bearer ' + this.auth.accessToken);
    oReq.responseType = 'json';
    oReq.onerror = (error) => {
      console.error('logout error');
      console.error(error);
    };
    oReq.send();

    this.clearCache(
      () => {
        NativeStorage.clear();
        this.events.publish('user:logout');
        completeCallBack();
      },
      failCallBack
    );
  }

  checkUsers(users) {
    this.users.push(...users.filter(u => u.mail !== null && (u.mobilePhone !== null || u.businessPhones.length !== 0)));
    NativeStorage.getItem('users').then(
      (cache) => {
        if (cache.length < this.users.length) {
          this.cacheUsers(this.users);
        }
      }, (error) => {
        if (error.code === 2) {
          NativeStorage.setItem('users', this.users);
        }
      });
    this.updateUserThumbs();
  }

  setUsers(users) {
    this.users = [];
    this.checkUsers(users);
    this.events.publish('users:change', this.users);
  }

  getLocalUsers() {
    if (this.cachedUsers.length === 0) {
      NativeStorage.getItem('users')
        .then(
        (data) => {
          this.cachedUsers = data;
          this.setUsers(data.slice(0, 50));
        }, console.error
        );
    } else {
      this.setUsers(this.cachedUsers.slice(0, 50));
    }
  }

  getUserThumbs() {

    NativeStorage.getItem('userThumbs').then((data) => {
      this.userThumbs = data;
    }, () => { });
  }

  cacheUserThumbs() {
    if (Object.keys(this.userThumbs).length > 2) {
      NativeStorage.setItem('userThumbs', this.userThumbs);
    }
  }

  cacheUsers(users) {
    NativeStorage.setItem('users', users);
    this.cachedUsers = users;
  }

  fetchProfilePicture(auth) {
    this.fetchProfilePictureById('me', true);
    // this.profilepic = this.userThumbs[auth.userInfo.uniqueId];
  }

  updateUserThumbs() {
    if (Network.connection !== 'none') {
      for (var i = 0; i < this.users.length; i++) {
        var id = this.users[i].userPrincipalName;
        if (this.users[i].userPrincipalName.indexOf('kele') !== -1 || this.users[i].userPrincipalName.indexOf('fran') !== -1) {
          console.log(this.users[i]);

          if (!this.userThumbs[id]) {
            this.fetchProfilePictureById(id, false);
          }
        }
      }
    }
  }

  fetchProfilePictureById(id, isUser) {
    if (!this.userThumbs[id]) {
      if (this.startpoint !== 0) {
        this.users.length = this.startpoint;
        this.startpoint = 0;
      }
      var link = '';
      if (isUser) {
        link = Conf.resourceUri + Conf.graphApiVersion + 'me/photo/$value';
      } else {
        link = Conf.resourceUri + Conf.graphApiVersion + 'users/' + id + '/photo/$value';
        // link = Conf.resourceUri + Conf.graphApiVersion + 'users/arne.herbots@devoteam.be/photo/';
        // link = Conf.resourceUri + Conf.graphApiVersion + 'amina.fobelets@devoteam.be/photo/';
      }
      // var url = Conf.resourceUri + Conf.graphApiVersion + 'users/' + id + '/photo/$value';
      var oReq = new XMLHttpRequest();
      oReq.open('GET', link, true);
      oReq.setRequestHeader('Content-type', 'image/jpeg');
      oReq.setRequestHeader('Authorization', 'Bearer ' + this.auth.accessToken);
      oReq.responseType = 'arraybuffer';

      oReq.onload = (oEvent) => {
        // console.log(link);
        // console.log(oReq.response);
        var blob = new Blob([oReq.response], { type: 'image/jpg' });
        var reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          if (oReq.status === 200) {
            console.log('picture found for: ' + id);
            if (isUser) {
              this.profilepic = reader.result;
              NativeStorage.setItem('profilepic', this.profilepic);
            }
            this.userThumbs[id] = reader.result;
          }
        };
      };
      oReq.onerror = () => {
        console.error('404', id);
      };
      oReq.send();
    }
  }

  fetchUsers(completeCallBack, failCallBack) {
    // if (!this.fetching) {
    this.getAuth(
      auth => {
        this.auth = auth;
        this.fetchUsersWithAuth(
          auth,
          users => {
            this.setUsers(users);
            this.savedUsers = this.users.slice();
            // this.fetching = false;
            // this.events.publish('fetching', this.fetching);
            completeCallBack(users);
          },
          () => {
            // this.fetching = false;
            // this.events.publish('fetching', this.fetching);
            failCallBack();
          });
      },
      () => {
        // console.log('fetchEvent error in fetchUsers.getAuth');
        // this.fetching = false;
        // this.events.publish('fetching', this.fetching);
        failCallBack();
      });
    // }
  }

  fetchUsersWithAuth(auth, completeCallBack, failCallBack) {
    // this.fetching = true;
    // this.events.publish('fetching', this.fetching);
    this.zone.run(() => {
      this.http.get(Conf.resourceUri + Conf.graphApiVersion + 'myOrganization/users?$top=40', {
        headers: new Headers({
          'Authorization': 'Bearer ' + auth.accessToken
        })
      }).subscribe(res => {
        if (res.status === 200) {
          let data = res.json();
          let values = data.value;
          if (data['@odata.nextLink']) {
            this.nextLink = data['@odata.nextLink'];
          }
          completeCallBack(values);
        }
      },
        err => {
          console.error(err);
          failCallBack(err);
        });
    });
  }

  findUser(val, searchtType) {
    val = val.replace('\'', '\'\'');
    if (Network.connection !== 'none') {
      // this.getAuth(
      //   auth => {
      //     this.auth = auth;
      //   }, console.error);
      var query = '?$filter=startswith(' + searchtType + ',\'' + val + '\')';
      if (searchtType === 'displayName') {
        query += ' or startswith(surname,\'' + val + '\')';
      }

      this.url = Conf.resourceUri + Conf.graphApiVersion + 'myOrganization/users' + query;
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
        },
        err => {
          console.error(err);
        },
        () => { });
    } else {
      switch (searchtType) {
        case 'Job':
          this.setUsers(this.users.filter(u => u.jobTitle.startsWith(val)));
          break;
        case 'Department':
          this.setUsers(this.users.filter(u => u.department.startsWith(val)));
          break;
        default:
          this.setUsers(this.users.filter(u => u.displayName.startsWith(val) || u.surname.startsWith(val)));
          break;
      }
    }
  }

  getNextPage(infiniteScroll) {
    if (Network.connection !== 'none') {
      if (this.nextLink !== '') {
        var skiptoken = this.nextLink.substring(this.nextLink.search('skiptoken') + 12, this.nextLink.length - 1);
        skiptoken = '\'' + skiptoken + '\'';
        var newUrl = this.url + '&$skiptoken=X' + skiptoken;

        this.zone.run(() => {
          // this.http.get(Conf.resourceUri + Conf.graphApiVersion + 'myOrganization/users' + '?$top=20&$skiptoken=X' + skiptoken, {
          this.http.get(this.nextLink, {
            headers: new Headers({
              'Authorization': 'Bearer ' + this.auth.accessToken
            })
          }).subscribe(res => {
            var data = res.json();
            this.checkUsers(data.value);
            this.savedUsers = this.users.slice();
            if (data['@odata.nextLink']) {
              this.nextLink = data['@odata.nextLink'];
            } else {
              this.nextLink = '';
            }
            infiniteScroll.complete();
          },
            err => {
              
              console.error(err);
              console.log(this.auth);
              infiniteScroll.complete();
            });
        });
      } else {
        infiniteScroll.complete();
      }
    } else {
      if (this.startpoint === 0) {
        this.startpoint = this.users.length;
      }
      this.begin = this.users.length;
      this.end = this.begin + 50;
      if (this.end > this.cachedUsers.length - 1) {
        this.end = this.cachedUsers.length;
      }
      this.checkUsers(this.cachedUsers.slice(this.begin, this.end));
      infiniteScroll.complete();
    }
  }

  clearCache(completeCallBack, failCallBack) {
    this.users = [];
    this.cachedUsers = [];
    var context = new Microsoft.ADAL.AuthenticationContext(Conf.authority);
    context.tokenCache.clear().then(
      completeCallBack,
      err => {
        console.error('Failed to clear cache: ' + err);
        failCallBack(err);
      });
    this.auth = undefined;
    NativeStorage.clear();
  }

  setUsername(username) {
    NativeStorage.setItem('username', username);
  }

  getUsername() {
    return NativeStorage.getItem('username').then(value => {
      return value;
    });
  }

  authenticate(completeCallBack, failCallBack) {
    this.getAuth(
      auth => {
        this.auth = auth;
        completeCallBack();
      },
      err => {
        var context = new Microsoft.ADAL.AuthenticationContext(Conf.authority);
        // - We require user cridentials so triggers authentication dialog
        context.acquireTokenAsync(Conf.resourceUri, Conf.clientId, Conf.redirectUri)
          .then(completeCallBack, failCallBack);
      });
  }
}
