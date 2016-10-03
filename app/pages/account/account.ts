import { Component }        from '@angular/core';
import { NavController }    from 'ionic-angular';
import { UserData }      from '../../providers/user-data/user-data';
import { UserListPage }     from '../user-list/user-list';

@Component({
    templateUrl: 'build/pages/account/account.html',
})

export class AccountPage {

    username: string;

    constructor(private nav: NavController, private userData: UserData) {}

    ngAfterViewInit() {
        this.getUsername();
    }

    getUsername() {
        var _this = this;
        this.userData.getUsername().then((username) => {
          //  console.log('username = ' + username);
            _this.username = username;
        });
    }

    logout() {
        this.userData.logout(
          () => {},
          () => {}
        );
        this.nav.setRoot(UserListPage);
    }

}
