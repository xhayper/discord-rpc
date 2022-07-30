import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { CMD, EVT, Transport } from "./structures/Transport";
import { IPCTransport } from "./transport/ipc";
import { EventEmitter } from "stream";
import { ClientUser } from "./structures/ClientUser";
import TypedEmitter from "typed-emitter";
import { WebsocketTransport } from "./transport/websocket";
import { APIApplication, OAuth2Scopes } from "discord-api-types/v10";

export type AuthorizeOptions = {
    scopes?: (OAuth2Scopes | OAuth2Scopes[keyof OAuth2Scopes])[];
    clientSecret?: string;
    rpcToken?: boolean;
    redirectUri?: string;
    prompt?: string;
};

export interface ClientOptions {
    clientId: string;
    accessToken?: string;
    transport?: {
        type: "ipc" | "websocket" | Transport;
        formatPath?: (id: number) => string;
    };
}

export type ClientEvents = {
    ready: () => void;
    connected: () => void;
    disconnected: () => void;
};

export class Client extends (EventEmitter as new () => TypedEmitter<ClientEvents>) {
    clientId: string = "";
    accessToken: string = "";
    user?: ClientUser;
    application?: APIApplication;

    transport?: Transport;
    endPoint: string = "https://discord.com/api";
    origin: string = "https://localhost";

    private connectionPromoise?: Promise<void>;
    private _nonceMap = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>();

    constructor({ clientId, accessToken, transport }: ClientOptions) {
        super();

        this.clientId = clientId;
        this.accessToken = accessToken || "";

        this.transport =
            transport && transport.type && transport.type != "ipc"
                ? transport.type === "websocket"
                    ? new WebsocketTransport(this)
                    : transport.type
                : new IPCTransport(this, {
                      formatPathFunction: transport?.formatPath
                  });

        this.transport?.on("message", (message) => {
            if (message.cmd === "DISPATCH" && message.evt === "READY") {
                if (message.data.user) this.user = new ClientUser(this, message.data.user);
                this.emit("connected");
            } else {
                if (this._nonceMap.has(message.nonce)) {
                    this._nonceMap.get(message.nonce)?.resolve(message);
                    this._nonceMap.delete(message.nonce);
                }

                this.emit(message.evt, message.data);
            }
        });
    }

    async fetch(
        method: "GET" | "DELETE" | "HEAD" | "OPTIONS" | "POST" | "PUT" | "PATCH" | "PURGE" | "LINK" | "UNLINK",
        path: string,
        { data, query }: { data?: object; query?: string }
    ) {
        return await axios.request({
            method,
            url: `${this.endPoint}${path}${query ? new URLSearchParams(query) : ""}`,
            data,
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            }
        });
    }

    async request(cmd: CMD, args?: object, evt?: EVT): Promise<any> {
        if (!this.transport) return;

        return new Promise((resolve, reject) => {
            const nonce = uuidv4();

            this.transport!.send({ cmd, args, evt, nonce });
            this._nonceMap.set(nonce, { resolve, reject });
        });
    }

    async authenticate(accessToken: string) {
        const { application, user } = (await this.request("AUTHENTICATE", { access_token: accessToken })).data;
        this.accessToken = accessToken;
        this.application = application;
        this.user = user;
        this.emit("ready");
    }

    async authorize({ scopes, clientSecret, rpcToken, redirectUri, prompt }: AuthorizeOptions = {}) {
        if (clientSecret && rpcToken === true) {
            const data = (
                await this.fetch("POST", "/oauth2/token/rpc", {
                    data: {
                        client_id: this.clientId,
                        client_secret: clientSecret
                    }
                })
            ).data;
            rpcToken = (data as any).rpc_token;
        }

        const { code } = await this.request("AUTHORIZE", {
            scopes,
            client_id: this.clientId,
            prompt,
            rpc_token: rpcToken,
            redirect_uri: redirectUri
        });

        const response = (
            await this.fetch("POST", "/oauth2/token", {
                data: {
                    client_id: this.clientId,
                    client_secret: clientSecret,
                    code,
                    grant_type: "authorization_code",
                    redirect_uri: redirectUri
                }
            })
        ).data;

        return response.access_token;
    }

    async connect(): Promise<void> {
        if (this.connectionPromoise) return this.connectionPromoise;

        this.connectionPromoise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("RPC_CONNECTION_TIMEOUT")), 10e3);
            timeout.unref();

            this.once("connected", () => {
                clearTimeout(timeout);
                resolve();
            });

            this.transport?.once("close", () => {
                this._nonceMap.forEach((promise) => {
                    promise.reject(new Error("connection closed"));
                });
                this.emit("disconnected");
                reject(new Error("connection closed"));
            });

            this.transport?.connect();
        });

        return this.connectionPromoise;
    }

    async login(options: { accessToken?: string } & AuthorizeOptions = {}) {
        let { accessToken, scopes } = options;

        await this.connect();

        if (!scopes) {
            this.emit("ready");
            return this;
        }

        if (!accessToken) accessToken = await this.authorize({ scopes });
        if (!accessToken) return;

        return this.authenticate(accessToken);
    }

    async destroy() {
        await this.transport?.close();
    }
}
