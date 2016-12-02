import { Injectable, NgZone } from '@angular/core';
import { Events, LocalStorage, Storage } from 'ionic-angular';
import { NativeStorage, Network, Keyboard } from 'ionic-native';
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
  cachedUsers = [];
  profilepic = {};
  userThumbs = {};
  auth: any;
  nextLink = '';
  url = '';
  fetching = false;
  startpoint = 0;
  begin = 0;
  end = 0;

  constructor(private events: Events, private http: Http, private zone: NgZone) { }

  getAuth(completeCallBack, failCallBack) {
    console.log('GETAUTH');

    // let ctrl = this;
    let authContext = new Microsoft.ADAL.AuthenticationContext(Conf.authority);
    authContext.tokenCache.readItems().then(items => {
      // - Attem to get from the cache
      if (items.length > 0) {
        var authority = items[0].authority;
        authContext = new Microsoft.ADAL.AuthenticationContext(authority);
        // - Attempt to authorize user silently
        authContext.acquireTokenSilentAsync(Conf.resourceUri, Conf.clientId)
          .then(completeCallBack, () => {
            authContext = new Microsoft.ADAL.AuthenticationContext(Conf.authority);
            authContext.acquireTokenAsync(Conf.resourceUri, Conf.clientId, Conf.redirectUri).then(completeCallBack, failCallBack);
          });
      } else {
        this.events.publish('user:initialLogin');
        authContext = new Microsoft.ADAL.AuthenticationContext(Conf.authority);
        // - We require user cridentials so triggers authentication dialog
        authContext.acquireTokenAsync(Conf.resourceUri, Conf.clientId, Conf.redirectUri)
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
        console.log(auth);
        this.auth = auth;
        var username = auth.userInfo.displayableId;
        this.setUsername(username);
        this.events.publish('user:login');
        this.fetchUsersWithAuth(auth,
          values => {
            this.setUsers(values);
            console.log(this.users[3]);
            console.log('login ' + this.users.length + ' users set');
          },
          err => {
            console.error(err);
            console.log('login failed');
          });
      },
      error => {
        console.error(error);
        console.log('login failed');
        failCallBack();
      }
    );
  }

  logout(completeCallBack, failCallBack) {
    console.log('LOGOUT');

    this.users = [];
    var url = Conf.authority + '/oauth2/logout';

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
        this.storage.remove('username');
        NativeStorage.clear();
        this.events.publish('user:logout');
        completeCallBack();
      },
      failCallBack
    );
  }

  checkUsers(users) {
    console.log('CHECKUSERS');

    // this.users.push(...users.filter(u => u.mail !== null && (u.mobilePhone !== null || u.telephoneNumber !== null)));
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
      console.log(this.users[0]);
  }

  setUsers(users) {
    console.log('SETUSERS');

    this.users = [];
    this.checkUsers(users);
    this.events.publish('users:change', this.users);
  }

  getUsers() {
    console.log('GETUSERS');

    this.getUserThumbs();
    if (this.users.length !== 0) {
      return this.users;
    } else {
      this.getLocalUsers();
      if (Network.connection !== 'none') {
        this.fetchUsers((users) => {
          this.cacheUserThumbs();
          return users;
        }, console.error);
      }
    }
  }

  getLocalUsers() {
    console.log('GETLOCALUSERS');

    if (this.cachedUsers.length === 0) {
      NativeStorage.getItem('users')
        .then(
        (data) => {
          this.cachedUsers = data;
          this.setUsers(data.slice(0, 50));
        }, () => {
          console.error();
        });
    } else {
      this.setUsers(this.cachedUsers.slice(0, 50));
    }
  }

  getUserThumbs() {
    console.log('GETUSERTHUMBS');

    NativeStorage.getItem('userThumbs').then((data) => {
      this.userThumbs = data;
    }, () => { });

  }

  cacheUserThumbs() {
    console.log('CACHEUSERTHUMBS');

    if (Object.keys(this.userThumbs).length > 2) {
      NativeStorage.setItem('userThumbs', this.userThumbs);
    }
  }

  cacheUsers(users) {
    console.log('CACHEUSERS');

    NativeStorage.setItem('users', users);
    this.cachedUsers = users;
  }

  fetchProfilePicture(auth) {
    console.log('FETCHPROFILEPICTURE');

    this.fetchProfilePictureById(auth.userInfo.uniqueId, true);
    this.profilepic = this.userThumbs[auth.userInfo.uniqueId];
  }

  updateUserThumbs() {
    console.log('UPDATEUSERTHUMBS');
    if (Network.connection !== 'none') {
      // this.fetchProfilePictureById('test', false);
      for (var i = 0; i < this.users.length; i++) {
        var id = this.users[i].userPrincipalName;
        // if (this.users[i]['thumbnailPhoto@odata.mediaContentType']) {
        if (!this.userThumbs[id]) {
          // this.fetchProfilePictureById(id, false);
          // }
        }
      }
    }
  }

  fetchProfilePictureById(id, isUser) {
    console.log('FETCHPROFILEPICTUREBYID');
    if (!this.userThumbs[id]) {
      if (this.startpoint !== 0) {
        this.users.length = this.startpoint;
        this.startpoint = 0;
      }
      this.http.get('https://graph.microsoft.com/v1.0/users/' + id + '/photo/$value'
        , {
          headers: new Headers({
            'Authorization': 'Bearer ' + this.auth.accessToken
          })
        }
      ).subscribe(res => {
        console.log(res.json());
        if (res.status === 200) {
          var blob = new Blob([res], { type: 'image/jpg' });
          var reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            if (isUser) {
              this.profilepic = reader.result;
              NativeStorage.setItem('profilepic', this.profilepic);
            }
            this.userThumbs[id] = reader.result;
          };
        }
      },
        console.error);
    }

    //     var url = Conf.resourceUri + '/' + Conf.graphApiVersion + '/users/' + id + '/photo/$value';
    //     var oReq = new XMLHttpRequest();
    //     oReq.open('GET', url, true);
    //     oReq.setRequestHeader('Content-type', 'image/jpeg');
    //     oReq.setRequestHeader('Authorization', 'Bearer ' + auth.accessToken);
    //     oReq.responseType = 'arraybuffer';

    //     oReq.onload = (oEvent) => {
    //       console.log(url);
    //       console.log(oReq.response);
    //       var blob = new Blob([oReq.response], { type: 'image/jpg' });
    //       var reader = new FileReader();
    //       reader.readAsDataURL(blob);
    //       reader.onloadend = () => {
    //         if (oReq.status !== 404) {
    //           if (isUser) {
    //             this.profilepic = reader.result;
    //             NativeStorage.setItem('profilepic', this.profilepic);
    //           }
    //           this.userThumbs[id] = reader.result;
    //         }
    //       };
    //     };
    //     oReq.onerror = () => {
    //       console.error('404', id);
    //     };
    //     oReq.send();
    //   },
    //     console.error);
    // }
  }

  getOnlineUsers() {
    console.log('GETONLINEUSERS');

    if (Network.connection !== 'none') {
      this.fetchUsers(() => {
        if (this.users.length !== 0) {
          this.cacheUsers(this.users);
          return this.users;
        }
        return;
      },
        err => {
          console.error(err);
        });
    }
  }

  fetchUsers(completeCallBack, failCallBack) {
    if (!this.fetching) {
      console.log('FETCHUSERS');
      this.getAuth(
        auth => {
          this.auth = auth;
          this.fetchUsersWithAuth(
            auth,
            users => {
              this.setUsers(users);
              this.fetching = false;
              console.log('fetchUsers sending fetchEvent ', this.fetching);
              this.events.publish('fetching', this.fetching);
              completeCallBack(users);
            },
            () => {
              console.log('fetchEvent error in fetchUsers.fetchUsersWithAuth');
              this.fetching = false;
              this.events.publish('fetching', this.fetching);
              failCallBack();
            }
          );
        },
        () => {
          // console.log('fetchEvent error in fetchUsers.getAuth');
          // this.fetching = false;
          // this.events.publish('fetching', this.fetching);
          failCallBack();
        }
      );
    }
  }

  fetchUsersWithAuth(auth, completeCallBack, failCallBack) {
    console.log('FETCHUSERSWITHAUTH');

    this.fetching = true;
    console.log('fetchUsersWithAuth sending fetchEvent true');
    this.events.publish('fetching', this.fetching);

    this.zone.run(() => {
      this.http.get(Conf.resourceUri + '/' + Conf.graphApiVersion + '/myOrganization/users?$top=50', {
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
        }
        );
    });


    // this.url = Conf.resourceUri + '/' + Conf.graphApiVersion + '/$metadata#users';
    // var values = [];
    // var hed: Headers = new Headers();
    // hed.set('Content-type', 'application/json');
    // hed.append('Authorization', 'Bearer ' + auth.accessToken);
    // var opt: RequestOptions = new RequestOptions({ headers: hed });
    // this.http.get(this.url, opt).map((res: Response) => {
    //   console.log(res);
    //   return res.json();
    // }).subscribe(
    //   data => {
    //     values = data.value;
    //     console.log('test', data['odata.nextLink']);
    //     if (data['odata.nextLink']) {
    //       this.nextLink = data['odata.nextLink'];
    //     }
    //     completeCallBack(values);
    //   },
    //   err => {
    //     console.error(err);
    //     failCallBack(err);
    //   },
    //   () => { }
    //   );
  }

  findUser(val, searchtType) {
    console.log('FINDUSER');

    val = val.replace('\'', '\'\'');
    if (Network.connection !== 'none') {
      this.getAuth(
        auth => {
          this.auth = auth;
        }, console.error);
      var query = '?$filter=startswith(' + searchtType + ',\'' + val + '\')';
      if (searchtType === 'displayName') {
        query += ' or startswith(surname,\'' + val + '\')';
      }

      this.url = Conf.resourceUri + '/' + Conf.graphApiVersion + '/myOrganization/users' + query;
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
          if (values.length === 1) {
            // Keyboard.close();
          }
          if (data['@odata.nextLink']) {
            this.nextLink = data['@odata.nextLink'];
          } else {
            this.nextLink = '';
          }
        },
        err => {
          console.error(err);
        },
        () => { }
        );
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
    console.log('GETNEXTPAGE');

    if (Network.connection !== 'none') {
      if (this.nextLink !== '') {
        var skiptoken = this.nextLink.substring(this.nextLink.search('skiptoken') + 12, this.nextLink.length - 1);
        skiptoken = '\'' + skiptoken + '\'';
        var newUrl = this.url + '&$skiptoken=X' + skiptoken;

        this.zone.run(() => {
          // this.http.get(Conf.resourceUri + '/' + Conf.graphApiVersion + '/myOrganization/users' + '?$top=20&$skiptoken=X' + skiptoken, {
          this.http.get(this.nextLink, {
            headers: new Headers({
              'Authorization': 'Bearer ' + this.auth.accessToken
            })
          }).subscribe(res => {
            var data = res.json();
            this.checkUsers(data.value);
            if (data['@odata.nextLink']) {
            this.nextLink = data['@odata.nextLink'];
            } else {
              this.nextLink = '';
            }
            infiniteScroll.complete();
          },
            err => {
              console.error(err);
              infiniteScroll.complete();
            }
            );
        });


        // var hed: Headers = new Headers();
        // hed.set('Content-type', 'application/json');
        // hed.append('Authorization', 'Bearer ' + this.auth.accessToken);
        // var opt: RequestOptions = new RequestOptions({ headers: hed });
        // this.http.get(newUrl, opt).map((res: Response) => {
        //   return res.json();
        // })
        //   .subscribe(data => {
        //     this.checkUsers(data.value);
        //     if (data['odata.nextLink']) {
        //       this.nextLink = data['odata.nextLink'];
        //     } else {
        //       this.nextLink = '';
        //     }
        //     infiniteScroll.complete();
        //   }
        //   ,
        //   err => {
        //     console.error(err);
        //   },
        //   () => { }
        //   );
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
    console.log('CLEARCACHE');
    this.users = [];
    this.cachedUsers = [];
    var context = new Microsoft.ADAL.AuthenticationContext(Conf.authority);
    context.tokenCache.clear().then(
      completeCallBack,
      err => {
        console.error('Failed to clear cache: ' + err);
        failCallBack(err);
      }
    );
    this.auth = {};
    NativeStorage.clear();
  }

  setUsername(username) {
    console.log('SETUSERNAME');

    this.storage.set('username', username);
  }

  getUsername() {
    console.log('GETUSERNAME');

    return this.storage.get('username').then(value => {
      return value;
    });
  }

  authenticate(completeCallBack, failCallBack) {
    console.log('AUTHENTICATE');

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
      }
    );
  }
}
