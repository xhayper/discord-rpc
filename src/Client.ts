import axios, { AxiosResponse, Method } from "axios";
import { APIApplication, OAuth2Scopes } from "discord-api-types/v10";
import { EventEmitter } from "stream";
import TypedEmitter from "typed-emitter";
import { v4 as uuidv4 } from "uuid";
import { ClientUser } from "./structures/ClientUser";
import { CMD, CommandIncoming, EVT, Transport, TransportOptions } from "./structures/Transport";
import { FormatFunction, IPCTransport } from "./transport/IPC";
import { WebSocketTransport } from "./transport/WebSocket";

export type AuthorizeOptions = {
    scopes: (OAuth2Scopes | `${OAuth2Scopes}`)[];
    redirect_uri?: string;
    prompt?: "consent" | "none";
    useRPCToken?: boolean;
};

export interface ClientOptions {
    clientId: string;
    clientSecret?: string;
    instanceId?: number;
    transport?: {
        type?: "ipc" | "websocket" | { new (options: TransportOptions): Transport };
        pathList?: FormatFunction[];
    };
    debug?: boolean;
}

export type ClientEvents = {
    ready: () => void;
    connected: () => void;
    disconnected: () => void;
};

export class Client extends (EventEmitter as new () => TypedEmitter<ClientEvents>) {
    clientId: string;
    clientSecret?: string;

    instanceId?: number;

    private accessToken?: string;
    private refreshToken?: string;
    private tokenType = "Bearer";

    readonly transport: Transport;
    readonly debug: boolean;

    user?: ClientUser;
    application?: APIApplication;

    cdnHost: string = "https://cdn.discordapp.com";
    origin: string = "https://localhost";

    private refrestTimeout?: NodeJS.Timer;
    private connectionPromise?: Promise<void>;
    private _nonceMap = new Map<string, { resolve: (value?: any) => void; reject: (reason?: any) => void }>();

    constructor(options: ClientOptions) {
        super();

        this.clientId = options.clientId;
        this.clientSecret = options.clientSecret;

        this.instanceId = options.instanceId;

        this.debug = !!options.debug; // Funky Javascript :)

        this.transport =
            options.transport && options.transport.type && options.transport.type != "ipc"
                ? options.transport.type === "websocket"
                    ? new WebSocketTransport({ client: this })
                    : new options.transport.type({ client: this })
                : new IPCTransport({
                      client: this,
                      pathList: options.transport?.pathList
                  });

        this.transport.on("message", (message) => {
            if (message.cmd === "DISPATCH" && message.evt === "READY") {
                if (message.data.user) this.user = new ClientUser(this, message.data.user);
                if (message.data.config && message.data.config.cdn_host)
                    this.cdnHost = `https://${message.data.config.cdn_host}`;
                this.emit("connected");
            } else {
                if (message.nonce && this._nonceMap.has(message.nonce)) {
                    this._nonceMap.get(message.nonce)?.resolve(message);
                    this._nonceMap.delete(message.nonce);
                }

                this.emit((message as any).evt, message.data);
            }
        });
    }

    async fetch<R = any>(
        method: Method | string,
        path: string,
        requst?: { data?: any; query?: string; headers?: any }
    ): Promise<AxiosResponse<R>> {
        return await axios.request({
            method,
            url: `https://discord.com/api${path}${requst?.query ? new URLSearchParams(requst?.query) : ""}`,
            data: requst?.data,
            headers: {
                ...(requst?.headers ?? {}),
                ...(this.accessToken ? { Authorization: `${this.tokenType} ${this.accessToken}` } : {})
            }
        });
    }

    async request<A = any, D = any>(cmd: CMD, args?: any, evt?: EVT): Promise<CommandIncoming<A, D>> {
        return new Promise((resolve, reject) => {
            const nonce = uuidv4();

            this.transport.send({ cmd, args, evt, nonce });
            this._nonceMap.set(nonce, { resolve, reject });
        });
    }

    async authenticate(): Promise<void> {
        const { application, user } = (await this.request("AUTHENTICATE", { access_token: this.accessToken ?? "" }))
            .data;
        this.application = application;
        this.user = new ClientUser(this, user);
        this.emit("ready");
    }

    private async refreshAccessToken(): Promise<void> {
        if (this.debug) console.log("CLIENT | Refreshing access token!");

        this.hanleAccessTokenResponse(
            (
                await this.fetch("POST", "/oauth2/token", {
                    data: new URLSearchParams({
                        client_id: this.clientId,
                        client_secret: this.clientSecret ?? "",
                        grant_type: "refresh_token",
                        refresh_token: this.refreshToken ?? ""
                    })
                })
            ).data
        );
    }

    private hanleAccessTokenResponse(data: any): void {
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.tokenType = data.token_type;

        this.refrestTimeout = setTimeout(() => this.refreshAccessToken(), data.expires_in - 5000);
    }

    async authorize(options: AuthorizeOptions): Promise<void> {
        let rpcToken;

        if (options.useRPCToken) {
            rpcToken = (
                await this.fetch("POST", "/oauth2/token/rpc", {
                    data: new URLSearchParams({
                        client_id: this.clientId,
                        client_secret: this.clientSecret ?? ""
                    })
                })
            ).data.rpc_token;
        }

        const { code } = (
            await this.request("AUTHORIZE", {
                scopes: options.scopes,
                client_id: this.clientId,
                rpc_token: options.useRPCToken ? rpcToken : undefined,
                redirect_uri: options.redirect_uri ?? undefined,
                prompt: options.prompt ?? "consent"
            })
        ).data;

        this.hanleAccessTokenResponse(
            (
                await this.fetch("POST", "/oauth2/token", {
                    data: new URLSearchParams({
                        client_id: this.clientId,
                        client_secret: this.clientSecret ?? "",
                        redirect_uri: options.redirect_uri ?? "",
                        grant_type: "authorization_code",
                        code
                    })
                })
            ).data
        );
    }

    async connect(): Promise<void> {
        if (this.connectionPromise) return this.connectionPromise;

        this.connectionPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("TRANSPORT_CONNECTION_TIMEOUT")), 10e3);
            timeout.unref();

            this.once("connected", () => {
                clearTimeout(timeout);
                resolve();
            });

            this.transport.once("close", () => {
                this._nonceMap.forEach((promise) => {
                    promise.reject(new Error("TRANSPORT_CONNECTION_CLOSE"));
                });
                this.emit("disconnected");
                reject(new Error("TRANSPORT_CONNECTION_CLOSE"));
            });

            this.transport.connect();
        });

        return this.connectionPromise;
    }

    async login(options?: AuthorizeOptions): Promise<void> {
        await this.connect();

        if (!options || !options.scopes) {
            this.emit("ready");
            return;
        }

        await this.authorize(options);
        await this.authenticate();
    }

    async subscribe(event: Exclude<EVT, "ERROR">, args?: any): Promise<{ unsubscribe: () => void }> {
        await this.request("SUBSCRIBE", args, event);
        return {
            unsubscribe: () => this.request("UNSUBSCRIBE", args, event)
        };
    }

    async destroy(): Promise<void> {
        if (this.refrestTimeout) {
            clearTimeout(this.refrestTimeout);
            this.refrestTimeout = undefined;
        }

        await this.transport.close();
    }
}
