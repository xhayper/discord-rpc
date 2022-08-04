import Payload from "discord-api-types/payloads/v10";
import { User } from "./User";

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
            await this.client.request("SET_ACTIVITY", {
                pid: pid ?? process ? process.pid ?? 0 : 0,
                activity: formattedAcitivity
            })
        ).data;
    }

    async clearActivity(pid?: number): Promise<void> {
        await this.client.request("SET_ACTIVITY", { pid: pid ?? process ? process.pid ?? 0 : 0 });
    }
}
