import Payload from "discord-api-types/payloads/v10";
import { RPC_ERROR_CODE } from "../structures/Transport";
import { CertifiedDevice } from "./CertifiedDevice";
import { Channel } from "./Channel";
import { Guild } from "./Guild";
import { RPC_CMD, CommandIncoming, RPC_EVT } from "./Transport";
import { User } from "./User";
import { VoiceSettings } from "./VoiceSettings";

export type SetActivity = {
    state?: string;
    details?: string;
    startTimestamp?: number | Date;
    endTimestamp?: number | Date;
    largeImageKey?: string;
    smallImageKey?: string;
    largeImageText?: string;
    smallImageText?: string;
    partyId?: string;
    partySize?: number;
    partyMax?: number;
    matchSecret?: string;
    joinSecret?: string;
    spectateSecret?: string;
    instance?: boolean;
    buttons?: Array<Payload.GatewayActivityButton>;
};

export type SetActivityResponse = {
    state?: string;
    buttons?: string[];
    name: string;
    application_id: string;
    type: Payload.ActivityType;
    metadata: {
        button_urls?: string[];
    };
};

export class ClientUser extends User {
    private throwError(ctx: { code: RPC_ERROR_CODE; message?: string }) {
        throw new Error(`[${RPC_ERROR_CODE[ctx.code]}]: ${ctx.message}`);
    }

    private async handleRequest<A = any, D = any>(
        cmd: RPC_CMD,
        args?: any,
        evt?: RPC_EVT
    ): Promise<CommandIncoming<A, D>> {
        const response = await this.client.request<A, D>(cmd, args);

        if (response.evt == "ERROR") this.throwError(response.data as any);

        return response;
    }

    // #region Helper function

    async fetchUser(userId: string): Promise<User> {
        return new User(this.client, (await this.handleRequest("GET_USER", { id: userId })).data);
    }

    async fetchGuild(guildId: string, timeout?: number): Promise<Guild> {
        return new Guild(this.client, (await this.handleRequest("GET_GUILD", { guild_id: guildId, timeout })).data);
    }

    async fetchGuilds(): Promise<Guild[]> {
        return (await this.handleRequest("GET_GUILDS")).data.guilds.map(
            (guildData: any) => new Guild(this.client, guildData)
        );
    }

    async fetchChannel(channelId: string): Promise<Channel> {
        return new Channel(this.client, (await this.handleRequest("GET_CHANNEL", { channel_id: channelId })).data);
    }

    async fetchChannels(guildId: string): Promise<Channel> {
        return (await this.handleRequest("GET_CHANNELS", { guild_id: guildId })).data.channels.map(
            (channelData: any) => new Channel(this.client, channelData)
        );
    }

    async getSelectedVoiceChannel(): Promise<Channel | null> {
        const response = await this.handleRequest("GET_SELECTED_VOICE_CHANNEL");
        return response.data != null ? new Channel(this.client, response.data) : null;
    }

    async selectVoiceChannel(channelId: string | null, timeout?: number, force?: boolean): Promise<Channel | null> {
        const response = await this.handleRequest("SELECT_VOICE_CHANNEL", { channel_id: channelId, timeout, force });
        return response.data != null ? new Channel(this.client, response.data) : null;
    }

    async getVoiceSettings(): Promise<VoiceSettings> {
        return new VoiceSettings(this.client, (await this.handleRequest("GET_VOICE_SETTINGS")).data);
    }

    async setVoiceSettings(voiceSettings: Partial<VoiceSettings>): Promise<VoiceSettings> {
        return new VoiceSettings(this.client, (await this.handleRequest("SET_VOICE_SETTINGS", voiceSettings)).data);
    }

    async setCeritfiedDevices(devices: CertifiedDevice[]): Promise<null> {
        return (await this.handleRequest("SET_CERTIFIED_DEVICES", { devices })).data;
    }

    async sendJoinInvite(userId: string): Promise<null> {
        return (await this.handleRequest("SEND_ACTIVITY_JOIN_INVITE", { user_id: userId })).data;
    }

    async closeJoinRequest(userId: string): Promise<null> {
        return (await this.handleRequest("CLOSE_ACTIVITY_JOIN_REQUEST", { user_id: userId })).data;
    }

    async selectTextChannel(channelId: string, timeout?: number): Promise<Channel | null> {
        return new Channel(
            this.client,
            (await this.handleRequest("SELECT_TEXT_CHANNEL", { channel_id: channelId, timeout })).data
        );
    }

    // TODO: Strict type these functions before uncommenting it in production

    // async createLobby(type: string, capacity: number, metadata: any): Promise<any> {
    //     return (await this.handleRequest("CREATE_LOBBY", { type, capacity, metadata })).data;
    // }

    // async updateLobby(
    //     lobbyId: string,
    //     options?: { type: string; owner_id: string; capacity: number; metadata: any }
    // ): Promise<any> {
    //     return (await this.handleRequest("UPDATE_LOBBY", { id: lobbyId, ...options })).data;
    // }

    // async deleteLobby(lobbyId: string): Promise<any> {
    //     return (await this.handleRequest("DELETE_LOBBY", { id: lobbyId })).data;
    // }

    // async connectToLobby(lobbyId: string, secret: string): Promise<any> {
    //     return (await this.handleRequest("CONNECT_TO_LOBBY", { id: lobbyId, secret })).data;
    // }

    // async sendToLobby(lobbyId: string, data: any): Promise<any> {
    //     return (await this.handleRequest("SEND_TO_LOBBY", { id: lobbyId, data })).data;
    // }

    // async disconnectFromLobby(lobbyId: string): Promise<any> {
    //     return (await this.handleRequest("DISCONNECT_FROM_LOBBY", { id: lobbyId })).data;
    // }

    // async updateLobbyMember(lobbyId: string, userId: string, metadata: any): Promise<any> {
    //     return (await this.handleRequest("UPDATE_LOBBY_MEMBER", { lobby_id: lobbyId, user_id: userId, metadata }))
    //         .data;
    // }

    async getRelationships(): Promise<Array<User>> {
        return (await this.client.request("GET_RELATIONSHIPS")).data.relationships.map((data: any) => {
            return new User(this.client, { ...data.user, presence: data.presence });
        });
    }

    async setActivity(activity: SetActivity, pid?: number): Promise<SetActivityResponse> {
        let formattedAcitivity: any = {
            ...activity,
            assets: {},
            timestamps: {},
            party: {},
            secrets: {}
        };

        if (activity.startTimestamp instanceof Date) {
            formattedAcitivity.timestamps.start = Math.round(activity.startTimestamp.getTime());
        } else if (typeof activity.startTimestamp === "number") {
            formattedAcitivity.timestamps.start = activity.startTimestamp;
        }

        if (activity.endTimestamp instanceof Date) {
            formattedAcitivity.timestamps.end = Math.round(activity.endTimestamp.getTime());
        } else if (typeof activity.endTimestamp === "number") {
            formattedAcitivity.timestamps.end = activity.endTimestamp;
        }

        if (activity.largeImageKey) formattedAcitivity.assets.large_image = activity.largeImageKey;
        if (activity.smallImageKey) formattedAcitivity.assets.small_image = activity.smallImageKey;
        if (activity.largeImageText) formattedAcitivity.assets.large_text = activity.largeImageText;
        if (activity.smallImageText) formattedAcitivity.assets.small_text = activity.smallImageText;

        if (activity.partyId) formattedAcitivity.party.id = activity.partyId;
        if (activity.partySize && activity.partyMax)
            formattedAcitivity.party.size = [activity.partySize, activity.partyMax];

        if (activity.joinSecret) formattedAcitivity.secrets.join = activity.joinSecret;
        if (activity.spectateSecret) formattedAcitivity.secrets.spectate = activity.spectateSecret;
        if (activity.matchSecret) formattedAcitivity.secrets.match = activity.matchSecret;

        if (Object.keys(formattedAcitivity.assets).length === 0) delete formattedAcitivity["assets"];
        if (Object.keys(formattedAcitivity.timestamps).length === 0) delete formattedAcitivity["timestamps"];
        if (Object.keys(formattedAcitivity.party).length === 0) delete formattedAcitivity["party"];
        if (Object.keys(formattedAcitivity.secrets).length === 0) delete formattedAcitivity["secrets"];

        formattedAcitivity.instance = !!activity.instance;

        // Clean-up
        delete formattedAcitivity["startTimestamp"];
        delete formattedAcitivity["endTimestamp"];
        delete formattedAcitivity["largeImageKey"];
        delete formattedAcitivity["smallImageKey"];
        delete formattedAcitivity["largeImageText"];
        delete formattedAcitivity["smallImageText"];
        delete formattedAcitivity["partyId"];
        delete formattedAcitivity["partySize"];
        delete formattedAcitivity["partyMax"];
        delete formattedAcitivity["joinSecret"];
        delete formattedAcitivity["spectateSecret"];
        delete formattedAcitivity["matchSecret"];

        return (
            await this.handleRequest("SET_ACTIVITY", {
                pid: pid ?? process ? process.pid ?? 0 : 0,
                activity: formattedAcitivity
            })
        ).data;
    }

    async clearActivity(pid?: number): Promise<void> {
        await this.handleRequest("SET_ACTIVITY", { pid: pid ?? process ? process.pid ?? 0 : 0 });
    }

    // #endregion
}
