import { Client } from "../client";
import { User } from "./user";

export type ActivityButton = {
    label: string;
    url: string;
};

export enum ActivityType {
    PLAYING,
    STREAMING,
    LISTENING,
    WATCHING,
    CUSTOM,
    COMPETING
}

export type Activity = {
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
    buttons?: Array<ActivityButton>;
};

export type SetActivityResponse = {
    state?: string;
    buttons?: string[];
    name: string;
    application_id: string;
    type: ActivityType;
    metadata: {
        button_urls?: string[];
    };
};

export class ClientUser extends User {
    client: Client;

    constructor(client: Client, props: object) {
        super(props);
        this.client = client;
    }

    async setActivity(activity: Activity, pid?: number): Promise<SetActivityResponse> {
        let formattedAcitivity: any = {
            ...activity,
            assets: {},
            timestamps: {},
            party: {},
            secrets: {}
        };

        if (activity.startTimestamp instanceof Date)
            formattedAcitivity.timestamps.start = Math.round(activity.startTimestamp.getTime());
        if (activity.endTimestamp instanceof Date)
            formattedAcitivity.timestamps.end = Math.round(activity.endTimestamp.getTime());

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
                pid: pid || process.pid,
                activity: formattedAcitivity
            })
        ).data;
    }

    clearActivity(pid?: number) {
        this.client.request("SET_ACTIVITY", { pid: pid || process.pid });
    }
}
