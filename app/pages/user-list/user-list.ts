import { Component } from '@angular/core';
import { Events, Loading, NavController, Alert, Platform } from 'ionic-angular';
import { Toast, SocialSharing, SMS, Network, CallNumber } from 'ionic-native';
import { UserData } from '../../providers/user-data/user-data';
import { ContactData } from '../../providers/contact-data/contact-data';
import { Lib } from '../../providers/lib/lib';

@Component({
    templateUrl: 'build/pages/user-list/user-list.html'
})

export class UserListPage {
    users = [];
    savedUsers = [];
    userThumbs = {};
    prevValue = '';
    search = 'Name';
    loading = Loading.create({
        content: 'Loading Users...'
    });

    constructor(
        private nav: NavController,
        private userData: UserData,
        private contactData: ContactData,
        private events: Events,
        private platform: Platform
    ) { }

    sanitize(url: string) {
        return this.userData[url];
    }

    ionViewWillEnter() {
        this.doSubscribe();
        this.users = this.userData.users;
        if (Network.connection !== 'none' && this.userData.fetching) {
            console.log('ionviewwillenter users = 0 ');
            this.nav.present(this.loading);
        }
    }

    getUsers() {

        if (this.userData.users.length <= 0) {
            this.setUsers(this.userData.getUsers());
        }
        this.savedUsers = this.users;
        this.userData.getUserThumbs();
        this.userThumbs = this.userData.userThumbs;
    }

    getNextPage(infiniteScroll) {
        this.userData.getNextPage(infiniteScroll);
        this.updateUserThumbs();
    }

    updateUserThumbs() {
        this.userData.updateUserThumbs();
        this.userThumbs = this.userData.userThumbs;
    }

    ionViewDidLeave() {
        this.userData.cacheUserThumbs();
        this.events.unsubscribe('users:change', () => { });
    }

    doSubscribe() {
        this.events.subscribe('users:change', (userEventData) => {

            if (!Lib.hasElementArray(userEventData)) return;

            var newUsers = userEventData[0];
            var len = newUsers.length;

            (len === 0) ? (this.users.length = 0) : (this.setUsers(newUsers));
            this.updateUserThumbs();
            this.savedUsers = newUsers;
            console.log('users changed in userlist', this.users.length);
        });
    }

    setUsers(users) {
        this.users = this.userData.users;
        this.loading.dismiss();
    }

    searchUser(ev: any) {
        // Reset items back to all of the items
        if (!this.savedUsers || this.savedUsers.length === 0) {
            this.savedUsers = this.users;
        }
        this.users = this.savedUsers;
        // set val to the value of the rchbar
        let val = ev.target.value;
        var searchType;


        // if the value is an empty string don't filter the items
        if (val && val.trim() !== '' && (val.length) >= 3) {
            switch (this.search) {
                case 'Job':
                    searchType = 'jobTitle';
                    break;
                case 'Department':
                    searchType = 'department';
                    break;
                default:
                    searchType = 'displayName';
                    break;
            }

            this.userData.findUser(val, searchType);
        } else {
            this.userData.fetchUsers(() => { this.users = this.userData.users; this.savedUsers = this.userData.users; }, console.error);
        }
        this.prevValue = val;
    }

    doImport(user) {
        if (this.platform.is('windows')) {
            user.photo = this.userThumbs[user.userPrincipalName];
            this.contactData.importUser(user);
        } else {
            Toast.show('Contact saved!', '5000', 'top').subscribe(
                toast => {
                    user.photo = this.userThumbs[user.userPrincipalName];
                    this.contactData.importUser(user);
                },
                error => {
                    console.error('Error', error);
                },
                () => {
                    console.error('Completed');
                }
            );
        }
    }

    doCall(user) {
        // if (this.platform.is('windows')) {
        CallNumber.callNumber(user.mobile, false);
        // } else {
        // if (!Lib.hasValue(user)) { console.error('user = null'); return; }
        // if (!Lib.hasValue(user.mobile)) { console.error('no phone number'); return; }
        // Lib.call(user.mobile);
        // }
    }

    doText(user) {
        if (this.platform.is('windows')) {
            SMS.send(user.mobile, 'Hello World');
        } else {
            if (!Lib.hasValue(user)) { console.error('user = null'); return; }
            if (!Lib.hasValue(user.mobile)) { console.error('no phone number'); return; }
            Lib.text(user.mobile);
        }
    }

    buildVCard(contact) {
        var str = contact.displayName + '\n';
        (contact.mobile) ? (str += 'Mobile: ' + contact.mobile + '\n') : ('');
        (contact.telephoneNumber) ? (str += 'Phone (fix): ' + contact.telephoneNumber + '\n') : ('');
        (contact.department) ? (str += 'Department: ' + contact.department + '\n') : ('');
        (contact.jobTitle) ? (str += 'Job Title: ' + contact.jobTitle + '\n') : ('');
        (contact.mail) ? (str += 'Email: ' + contact.mail + '\n') : ('');
        (contact.thumbnail) ? (str += contact.thumbnail + '\n') : ('');

        var vcard = str;
        // 'FN:' + contact.name.formatted + '\n' +

        // var file = new Blob([vcard], {type: 'vsf'});

        return vcard;
    }

    openUserShare(user) {
        var vcard = this.buildVCard(user);
        console.log(vcard);        
        SocialSharing.share(vcard, '', this.userThumbs[user.userPrincipalName], '');
    }

    doAlert(message: string) {
        let alert = Alert.create({
            title: 'Message',
            subTitle: message,
            buttons: ['OK']
        });
        this.nav.present(alert);
    }
}
