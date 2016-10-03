import { Injectable } from '@angular/core';
import { Events, LocalStorage, Storage } from 'ionic-angular';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Conf } from '../conf/conf';
import 'rxjs/add/operator/map';

declare var Microsoft: any;

@Injectable()
export class UserData {
  storage            = new Storage(LocalStorage);
  users              = [];

  constructor(private events: Events, private http: Http) {}

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
        this.fetchUsersWithAuth(
          auth,
          users => {
            this.setUsers(users);
            completeCallBack();
          },
          failCallBack);
      },
      failCallBack
    );
  }

  logout(completeCallBack, failCallBack) {

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
      this.users = users;
      this.events.publish('users:change', users);
  }

  getUsers() {
    return this.users;
  }

  fetchUsersWithAuth (auth, completeCallBack, failCallBack) {

    // success then load
    var url = Conf.resourceUri + '/' + auth.tenantId + '/users?api-version=' + Conf.graphApiVersion;
    var hed: Headers = new Headers();
    hed.set('Content-type', 'application/json');
    hed.append('Authorization', 'Bearer ' + auth.accessToken);
    var opt: RequestOptions = new RequestOptions({headers: hed});
    this.http.get(url, opt).map((res: Response) => res.json())
    .subscribe(
        data => {var users = data.value; completeCallBack(users); },
        err => { console.error(err); failCallBack(err); },
        () => { console.log('done');  }
    );
  }

  fetchUsers(completeCallBack, failCallBack) {
    this.getAuth(
      auth => {
        this.fetchUsersWithAuth(
          auth,
          users => {
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
