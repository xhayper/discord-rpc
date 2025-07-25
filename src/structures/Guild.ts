import type { Client } from "../Client";
import { type User } from "./User";
import { Base } from "./Base";

export class Guild extends Base {
    /**
     * guild id
     */
    public id: string;
    /**
     * guild name (2-100 characters, excluding trailing and leading whitespace)
     */
    public name: string;
    public icon_url: string | null;
    /**
     * guild member list
     * (always an empty array)
     * @deprecated
     */
    public members: User[] = []; // Always an empty array
    /**
     * the vanity url code for the guild
     */
    public vanity_url_code: string | null;

    constructor(client: Client, props: Record<string, any>) {
        super(client);
        Object.assign(this, props);

        this.id = props.id;
        this.name = props.name;
        this.icon_url = props.icon_url;
        this.vanity_url_code = props.vanity_url_code;
    }
}
