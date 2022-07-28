import axios, { AxiosResponse } from "axios";
import { User } from "./structures/user";
import { v4 as uuidv4 } from "uuid";

export type OAuthScope = "activities.read" | "activities.write" | "applications.builds.read" | "applications.builds.upload" | "applications.commands" | "applications.commands.update" | "applications.commands.permissions.update" | "applications.entitlements" | "applications.store.update" | "bot" | "connections" | "dm_channels.read" | "email" | "gdm.join" | "guilds" | "guilds.join" | "guilds.members.read" | "identify" | "messages.read" | "relationships.read" | "rpc" | "rpc.activities.write" | "rpc.notifications.read" | "rpc.voice.read" | "rpc.voice.write" | "voice" | "webhook.incoming";

export type AuthorizeOptions = {
    scopes?: OAuthScope[],
    clientSecret?: string,
    rpcToken?: boolean,
    redirectUri?: string,
    prompt?: string
}

export class Client {
    clientId: string = "";
    accessToken: string = "";
    user?: User;

    private fetch: (method: 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'PURGE' | 'LINK' | 'UNLINK', path: string, { data, query }: { data?: object, query?: string }) => Promise<AxiosResponse<any, any>>;
    private request?: () => void;

    constructor(clientId: string, accessToken?: string) {
        this.clientId = clientId;
        this.accessToken = accessToken || "";

        this.fetch = async (method: 'GET' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'PURGE' | 'LINK' | 'UNLINK', path: string, { data, query }: { data?: object, query?: string }) => {

            return axios.request({
                method,
                url: `https://discordapp.com/api${path}${query ? new URLSearchParams(query) : ''}`,
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                },
            })
        };
    }

    async authorize({ scopes, clientSecret, rpcToken, redirectUri, prompt }: AuthorizeOptions = {}) {
        if (clientSecret && rpcToken === true) {
            const body = await this.fetch('POST', '/oauth2/token/rpc', {
                data: {
                    client_id: this.clientId,
                    client_secret: clientSecret,
                },
            });
            rpcToken = (body as any).rpc_token;
        }

        const { code } = await this.request('AUTHORIZE', {
            scopes,
            client_id: this.clientId,
            prompt,
            rpc_token: rpcToken,
        });

        const response = await this.fetch('POST', '/oauth2/token', {
            data: {
                client_id: this.clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            },
        });

        return (response as any).access_token;
    }
}