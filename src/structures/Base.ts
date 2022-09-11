import { Snowflake } from "discord-api-types/globals";
import { Client } from "../client/Client";

export abstract class Base {
    public id: Snowflake = "";

    constructor(public readonly client: Client) {}

    _clone(): this {
        return Object.assign(Object.create(this), this);
    }

    _patch(data: any) {
        return data;
    }

    _update(data: any) {
        const clone = this._clone();
        this._patch(data);
        return clone;
    }

    valueOf() {
        return this.id;
    }
}
