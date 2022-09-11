import type { APIGuildMember, APIUser, GatewayPresenceUpdate, Snowflake, UserFlags, UserPremiumType } from "discord-api-types/v10";
import { Client } from "../client/Client";
import { Base } from "./Base";

export type UserResolvable = User | Snowflake;

export type RawUserData =
  | (APIUser & { member?: Omit<APIGuildMember, 'user'> })
  | (GatewayPresenceUpdate['user'] & Pick<APIUser, 'username'>);

export class User extends Base {
    public username: string = "";
    public discriminator: string = "";
    public avatar: string | null = null;
    public bot?: boolean;
    public system?: boolean;
    public banner?: string | null;
    public accentColor?: number | null;
    public flags?: UserFlags;
    public premium_type?: UserPremiumType;
    public public_flags?: UserFlags;

    constructor(client: Client, data: any) {
        super(client);

        this._patch(data);
    }

    _patch(data: any) {
    }
}
