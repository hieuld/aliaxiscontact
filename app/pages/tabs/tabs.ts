import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { UserListPage } from '../user-list/user-list';
import { ContactListPage } from '../contact-list/contact-list';
import { AboutPage } from '../about/about';

@Component({
    templateUrl: 'build/pages/tabs/tabs.html',
})

export class TabsPage {

    tab1Root: any = UserListPage;
    tab2Root: any = ContactListPage;
    tab3Root: any = AboutPage;
    mySelectedIndex: number;

    constructor(navParams: NavParams) {
        this.mySelectedIndex = navParams.data.tabIndex || 0;
    }

}
