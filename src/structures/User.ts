import type { UserFlags, UserPremiumType, PresenceUpdateStatus, GatewayActivity } from "discord-api-types/v10";
import type { Client } from "../Client";
import { Base } from "./Base";

export class User extends Base {
    /**
     * the user's id
     */
    public id: string;
    /**
     * the user's username, not unique across the platform
     */
    public username: string;
    /**
     * the user's 4-digit discord-tag
     */
    public discriminator: string;
    /**
     * the user's [avatar hash](https://discord.com/developers/docs/reference#image-formatting)
     */
    public avatar: string | null;
    /**
     * the [flags](https://discord.com/developers/docs/resources/user#user-object-user-flags) on a user's account
     */
    public flags?: UserFlags | undefined;
    /**
     * the [type of Nitro subscription](https://discord.com/developers/docs/resources/user#user-object-premium-types) on a user's account
     */
    public premium_type?: UserPremiumType | undefined;
    /**
     * the public [flags](https://discord.com/developers/docs/resources/user#user-object-user-flags) on a user's account
     */
    public public_flags?: UserFlags | undefined;

    /**
     * user's rich presence
     */
    public presence?:
        | {
              status?: PresenceUpdateStatus;
              activities?: GatewayActivity[];
          }
        | undefined;

    public avatar_decoration?: string | null;

    constructor(client: Client, props: Record<string, any>) {
        super(client);
        Object.assign(this, props);

        // word can't explains how much i hate this
        this.id = props.id;
        this.username = props.username;
        this.discriminator = props.discriminator;
        this.avatar = props.avatar;
    }

    /**
     * The URL to the user's avatar.
     */
    public get avatarUrl() {
        return this.client.getCdn().avatar(this.id, this.avatar!);
    }

    /**
     * The URL to the user's default avatar. (avatar that is used when user have no avatar)
     */
    public get defaultAvatarUrl() {
        return this.client.getCdn().defaultAvatar(parseInt(this.discriminator.substring(1)) % 5);
    }

    /**
     * User's tag
     */
    public get tag() {
        return `${this.username}#${this.discriminator}`;
    }
}
