import Payload from "discord-api-types/payloads/v10";
import { Client } from "../client";
import { Base } from "./Base";

export class User extends Base implements Payload.APIUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    bot?: boolean | undefined;
    system?: boolean | undefined;
    mfa_enabled?: boolean | undefined;
    banner?: string | null | undefined;
    accent_color?: number | null | undefined;
    locale?: string | undefined;
    verified?: boolean | undefined;
    email?: string | null | undefined;
    flags?: Payload.UserFlags | undefined;
    premium_type?: Payload.UserPremiumType | undefined;
    public_flags?: Payload.UserFlags | undefined;

    presence?:
        | {
              status?: Payload.PresenceUpdateStatus;
              activities?: Payload.GatewayActivity[];
          }
        | undefined;

    constructor(client: Client, props: any) {
        super(client);

        this.id = props.id;
        this.username = props.username;
        this.discriminator = props.discriminator;
        this.avatar = props.avatar;

        Object.assign(this, props);
    }

    get tag() {
        return `${this.username}#${this.discriminator}`;
    }
}
