import { Client } from "../client";

export class Base {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }
}
