import { User } from "./User";

export class ClientUser extends User {
    public mfaEnabled: boolean = false;
    public verified: boolean = false;
    public locale?: string;
    public email?: string | null;

    _patch(data: any) {
        super._patch(data);

        if ("verified" in data) {
            /**
             * Whether or not this account has been verified
             * @type {boolean}
             */
            this.verified = data.verified;
        }

        if ("mfa_enabled" in data) {
            this.mfaEnabled = typeof data.mfa_enabled === "boolean" ? data.mfa_enabled : null;
        }

        if ("token" in data) this.client.token = data.token;
    }

    public get presence() {
        return this.client.presence;
    };

    // public setPresence(data: PresenceData): ClientPresence;
    // public setStatus(status: PresenceStatusData): ClientPresence;
    // public setActivity(options?: ActivityOptions): ClientPresence;
    // public setActivity(name: string, options?: ActivityOptions): ClientPresence;
}
