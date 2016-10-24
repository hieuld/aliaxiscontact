import { Component }        from '@angular/core';
import { NavController }    from 'ionic-angular';
import { UserData }      from '../../providers/user-data/user-data';
import { UserListPage }     from '../user-list/user-list';
import { DomSanitizationService  } from '@angular/platform-browser';

declare function unescape(s: string): string;

@Component({
  templateUrl: 'build/pages/account/account.html',
})


export class AccountPage {

  username: string;
  profilepic: any;

  constructor(private nav: NavController, private userData: UserData, private sanitizer: DomSanitizationService) { }


  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
  ngAfterViewInit() {
    this.getUsername();
    this.profilepic = this.userData.profilepic;
    // var b64Response = encodeURIComponent(this.profilepic);
    //
    // // create an image
    // this.profilepic = 'data:image/jpg;base64,' + b64Response;


    // append it to your page
    //  document.body.appendChild(outputImg);
  }

  getUsername() {
    var _this = this;
    this.userData.getUsername().then((username) => {
      _this.username = username;
    });
  }

  logout() {
    this.userData.logout(
      () => { },
      () => { }
    );
    this.nav.setRoot(UserListPage);
  }

}
