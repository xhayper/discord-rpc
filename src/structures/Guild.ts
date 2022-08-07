import { Client } from "../Client";
import { Base } from "./Base";
import { User } from "./User";

export class Guild extends Base {
    id: string;
    name: string;
    icon_url: string | null;
    members: User[] = []; // Always an empty array
    vanity_url_code: string | null;

    constructor(client: Client, props: any) {
        super(client);
        Object.assign(this, props);

        this.id = props.id;
        this.name = props.name;
        this.icon_url = props.icon_url;
        this.vanity_url_code = props.vanity_url_code;
    }
}
