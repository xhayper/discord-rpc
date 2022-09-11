import { Client } from "../client/Client";

export class BaseManager {
    constructor(public readonly client: Client) {}
}