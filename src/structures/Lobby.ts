import { GatewayVoiceState } from "discord-api-types/v10";
import { Client } from "../Client";
import { Base } from "./Base";
import { User } from "./User";

export enum LobbyType {
    PRIVATE = 1,
    PUBLIC = 2
}

export class Lobby extends Base {
    application_id: string;
    capacity: number;
    id: string;
    locked: boolean;
    members: { metadata: any; user: User }[];
    metadata: any;
    owner_id: string;
    region: string;
    secret: string;
    type: LobbyType;
    voice_states: GatewayVoiceState;

    constructor(client: Client, props: any) {
        super(client);
        Object.assign(this, props);

        this.application_id = props.application_id;
        this.capacity = props.capacity;
        this.id = props.id;
        this.locked = props.locked;
        this.members = props.members;
        this.metadata = props.metadata;
        this.owner_id = props.owner_id;
        this.region = props.region;
        this.secret = props.secret;
        this.type = props.type;
        this.voice_states = props.voice_states;
    }

    async joinVoice() {
        await this.client.requestWithError("CONNECT_TO_LOBBY_VOICE", { id: this.id });
    }

    async leaveVoice() {
        await this.client.requestWithError("DISCONNECT_FROM_LOBBY_VOICE", { id: this.id });
    }

    async update(type?: LobbyType, owner_id?: string, capacity?: number, locked?: boolean, metadata?: any) {
        this.type = type || this.type;
        this.owner_id = owner_id || this.owner_id;
        this.capacity = capacity || this.capacity;
        this.metadata = metadata || this.metadata;

        return (
            await this.client.requestWithError("UPDATE_LOBBY", {
                id: this.id,
                type,
                owner_id,
                capacity,
                locked,
                metadata
            })
        ).data;
    }

    async updateMember(userId: string, metadata?: any) {
        await this.client.requestWithError("UPDATE_LOBBY_MEMBER", { lobby_id: this.id, user_id: userId, metadata });
    }

    async disconnect() {
        await this.client.requestWithError("DISCONNECT_FROM_LOBBY", { id: this.id });
    }

    async delete() {
        await this.client.requestWithError("DELETE_LOBBY", { id: this.id });
    }
}
