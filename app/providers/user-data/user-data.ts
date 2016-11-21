import { Injectable } from '@angular/core';
import { Events, LocalStorage, Storage, Loading } from 'ionic-angular';
import { NativeStorage, Network } from 'ionic-native';
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

    constructor(private events: Events, private http: Http) { }

    getAuth(completeCallBack, failCallBack) {
        if (Microsoft.ADAL) {
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
    }

    login(completeCallBack, failCallBack) {

        this.authenticate(
            auth => {
                this.events.publish('user:login');
                this.auth = auth;
                var username = auth.userInfo.displayableId;
                this.setUsername(username);
            },
            () => {
                console.log('failed to authenticate');
                failCallBack();
            }
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

        this.users.push(...users.filter(u => u.mail !== null && (u.mobile !== null || u.telephoneNumber !== null)));
        NativeStorage.getItem('users').then(
            (cache) => {
                console.log('cache', cache.length, 'users', this.users.length);
                if (cache.length < this.users.length) {
                    console.log('meer users dan welleer');
                    this.cacheUsers(this.users);
                }
            }, (error) => {
                if (error.code === 2) {
                    NativeStorage.setItem('users', this.users);
                }
            });

        // return returnValues;
    }

    setUsers(users) {
        this.users = [];
        this.checkUsers(users);
        this.events.publish('users:change', this.users);
    }

    getUsers() {
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
        if (this.cachedUsers.length === 0) {
            NativeStorage.getItem('users')
                .then(
                (data) => {
                    this.cachedUsers = data;
                    this.setUsers(data.slice(0, 50));
                }, () => {
                    console.log('oeps');
                    console.error();
                });
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

    getOnlineUsers() {
        if (Network.connection !== 'none') {
            this.fetchUsers(() => {
                if (this.users.length !== 0) {
                    this.cacheUsers(this.users);
                    console.log(this.users.length);
                    return this.users;
                }
                return;
            },
                err => {
                    console.error(err);
                });
        }
    }

    fetchUsersWithAuth(auth, completeCallBack, failCallBack) {
        // if (Network.connection !== 'none') {
        this.url = Conf.resourceUri + '/' + auth.tenantId + '/users?$top=50&api-version=' + Conf.graphApiVersion;
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
        // }
    }

    findUser(val, searchtType) {
        console.log(val);
        val = val.replace('\'', '\'\'');
        console.log(val);
        if (Network.connection !== 'none') {
            this.getAuth(
                auth => {
                    this.auth = auth;
                }, console.error);
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
        if (Network.connection !== 'none') {
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
                        this.checkUsers(data.value);
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
        } else {
            if (this.startpoint === 0 ) {
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

    fetchProfilePicture(auth) {
        // if (Network.connection !== 'none') {
        this.fetchProfilePictureById(auth.userInfo.uniqueId, true);
        // }
        this.profilepic = this.userThumbs[auth.userInfo.uniqueId];
    }

    updateUserThumbs() {
        if (Network.connection !== 'none') {
            for (var i = 0; i < this.users.length; i++) {
                var id = this.users[i].userPrincipalName;
                if (this.users[i]['thumbnailPhoto@odata.mediaContentType']) {
                    if (!this.userThumbs[id]) {
                        this.fetchProfilePictureById(id, false);
                    }
                }
            };
        }
    }

    fetchProfilePictureById(id, isUser) {
        if (!this.userThumbs[id]) {
            if (this.startpoint !== 0) {
                this.users.length = this.startpoint;
                this.startpoint = 0;
            }

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
        this.fetching = true;
        this.getAuth(
            auth => {
                this.fetchUsersWithAuth(
                    this.auth,
                    users => {
                        this.setUsers(users);
                        this.fetching = false;
                        completeCallBack(users);
                    },
                    () => {
                        this.fetching = false;
                        failCallBack();
                    }
                );
            }
            ,
            failCallBack
        );
    }

    clearCache(completeCallBack, failCallBack) {

        var context = new Microsoft.ADAL.AuthenticationContext(Conf.authority);
        context.tokenCache.clear().then(
            completeCallBack,
            err => {
                console.error('Failed to clear cache: ' + err);
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
