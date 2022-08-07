import Payload from "discord-api-types/payloads/v10";
import { Client } from "../Client";
import { Base } from "./Base";

export class User extends Base {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    flags?: Payload.UserFlags | undefined;
    premium_type?: Payload.UserPremiumType | undefined;
    public_flags?: Payload.UserFlags | undefined;

    presence?:
        | {
              status?: Payload.PresenceUpdateStatus;
              activities?: Payload.GatewayActivity[];
          }
        | undefined;

    avatar_decoration?: string | null;

    constructor(client: Client, props: any) {
        super(client);

        // word can't explains how much i hate this
        this.id = props.id;
        this.username = props.username;
        this.discriminator = props.discriminator;
        this.avatar = props.avatar;

        Object.assign(this, props);
    }

    get avatarUrl() {
        const isAnimated = this.avatar && this.avatar.startsWith("a_");
        return this.avatar
            ? `${this.client.cdnHost}/avatars/${this.id}/${this.avatar}${isAnimated ? ".gif" : ".png"}`
            : this.defaultAvatarUrl;
    }

    get defaultAvatarUrl() {
        return `${this.client.cdnHost}/embed/avatars/${parseInt(this.discriminator.substring(1)) % 5}.png`;
    }

    get tag() {
        return `${this.username}#${this.discriminator}`;
    }
}
