import { EventAggregator } from 'aurelia-event-aggregator';
import { WebAPI } from './web-api';
import { ContactUpdated, ContactViewed } from './messages';
export class ContactList {
    constructor(api, ea) {
        this.api = api;
        this.contacts = [];
        ea.subscribe(ContactViewed, msg => this.select(msg.contact));
        ea.subscribe(ContactUpdated, msg => {
            let id = msg.contact.id;
            let found = this.contacts.filter(x => x.id == id)[0];
            Object.assign(found, msg.contact);
        });
    }
    created() {
        this.api.getContactList().then(contacts => {
            this.contacts = contacts;
        });
    }
    select(contact) {
        this.selectedId = contact.id;
        return true;
    }
}
ContactList.inject = [WebAPI, EventAggregator];
