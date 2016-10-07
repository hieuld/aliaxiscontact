import { Injectable } from '@angular/core';
import { Events, LocalStorage, Storage } from 'ionic-angular';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Conf } from '../conf/conf';
import 'rxjs/add/operator/map';

declare var Microsoft: any;

@Injectable()
export class UserData {
  storage = new Storage(LocalStorage);
  users = [];

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
        var username = auth.userInfo.displayableId;
        this.setUsername(username);
        this.events.publish('user:login');
        // this.fetchUsersWithAuth(auth, users => { this.setUsers(users);completeCallBack();},failCallBack);
      },
      failCallBack
    );
  }

  logout(completeCallBack, failCallBack) {
    this.users = [];
    this.clearCache(
      () => {
        this.storage.remove('username');
        this.events.publish('user:logout');
        this.setUsers([]);
        completeCallBack();
      },
      failCallBack
    );
  }

  setUsers(users) {
    // var count = 0;
    for (var i = 0; i < users.length; i++) {
      if (users[i].mail !== null && (users[i].mobile !== null || users[i].telephoneNumber !== null)) {
        this.users.push(users[i]);
      }
      // else {
      // count++;
      // console.log(i, 'name', users[i].displayName, 'mail', users[i].mail, 'mobile', users[i].mobile, 'phone', users[i].telephoneNumber);
      // }
    }
    // console.log('refused ' + count + ' users');

    this.users.sort(function(a, b) {
      var nameA = a.displayName.toUpperCase(); // ignore upper and lowercase
      var nameB = b.displayName.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      // names must be equal
      return 0;
    }); // sort((n1, n2) => n1.displayName - n2.displayName);
    this.storage.set('users', this.users);
    this.events.publish('users:change', this.users);
  }

  getUsers() {
    if (this.users.length === 0) {
      this.fetchUsers(() => {
        console.log('users were empty, reloading them now.');
      },
        err => {
          console.error(err);
        });
    } else {
      return this.users;
    }
  }

  getLocalUsers() {
    var localUsers = [];
    var str = '';
    this.storage.get('users').then(value => {
      localUsers = value; console.log('#value', value.length); for (var property in value) {
        str += property + ': ' + value[str] + '; ';
      }; console.log(str);
    });
    console.log('get', this.storage.get('users'));

    return localUsers;
  }

  fetchUsersWithAuth(auth, completeCallBack, failCallBack) {

    // success then load
    var url = Conf.resourceUri + '/' + auth.tenantId + '/users?api-version=' + Conf.graphApiVersion;
    var hed: Headers = new Headers();
    hed.set('Content-type', 'application/json');
    hed.append('Authorization', 'Bearer ' + auth.accessToken);
    var opt: RequestOptions = new RequestOptions({ headers: hed });
    this.http.get(url, opt).map((res: Response) => res.json())
      .subscribe(
      data => { var users = data.value; console.log('#users' + data.value.length); completeCallBack(users); },
      err => { console.error(err); failCallBack(err); },
      () => { console.log('done'); }
      );
  }

  fetchUsers(completeCallBack, failCallBack) {
    var t0 = performance.now();
    var t1 = 0;
    this.getAuth(
      auth => {
        this.fetchUsersWithAuth(
          auth,
          users => {
            this.setUsers(users);
            completeCallBack(users);
            t1 = performance.now();
            console.log('Call to fetchusers took ' + (t1 - t0) / 1000 + ' seconds.');
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
