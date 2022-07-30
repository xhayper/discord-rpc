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
            ? `https://cdn.discordapp.com/avatars/${this.id}/${this.avatar}${isAnimated ? ".gif" : ".png"}`
            : this.defaultAvatarUrl;
    }

    get defaultAvatarUrl() {
        return `https://cdn.discordapp.com/embed/avatars/${parseInt(this.discriminator.substring(1)) % 5}.png`;
    }

    get tag() {
        return `${this.username}#${this.discriminator}`;
    }
}
