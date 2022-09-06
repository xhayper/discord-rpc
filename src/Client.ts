import { ClientUser } from "./structures/ClientUser";
import {
    RPC_CMD,
    CommandIncoming,
    RPC_EVT,
    Transport,
    TransportOptions,
    RPC_ERROR_CODE,
    CUSTOM_RPC_ERROR_CODE
} from "./structures/Transport";
import { FormatFunction, IPCTransport } from "./transport/IPC";
import { WebSocketTransport } from "./transport/WebSocket";
import { RPCError } from "./utils/RPCError";
import { TypedEmitter } from "./utils/TypedEmitter";
import axios, { AxiosResponse, Method } from "axios";
import type { APIApplication, OAuth2Scopes } from "discord-api-types/v10";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";

export type AuthorizeOptions = {
    scopes: (OAuth2Scopes | `${OAuth2Scopes}`)[];
    redirect_uri?: string;
    prompt?: "consent" | "none";
    useRPCToken?: boolean;
};

export interface ClientOptions {
    /**
     * application id
     */
    clientId: string;
    /**
     * application secret
     */
    clientSecret?: string;
    /**
     * pipe id
     */
    instanceId?: number;
    /**
     * transport configs
     */
    transport?: {
        /**
         * transport type
         */
        type?: "ipc" | "websocket" | { new (options: TransportOptions): Transport };
        /**
         * ipc transport's path list
         */
        pathList?: FormatFunction[];
    };
    /**
     * debug mode
     */
    debug?: boolean;
}

export type ClientEvents = {
    /**
     * fired when the client is ready
     */
    ready: () => void;
    /**
     * fired when the client is connected to local rpc server
     */
    connected: () => void;
    /**
     * fired when the client is disconnected from the local rpc server
     */
    disconnected: () => void;
};

export class Client extends (EventEmitter as new () => TypedEmitter<ClientEvents>) {
    /**
     * application id
     */
    clientId: string;
    /**
     * application secret
     */
    clientSecret?: string;

    /**
     * pipe id
     */
    instanceId?: number;

    private accessToken?: string;
    private refreshToken?: string;
    private tokenType = "Bearer";

    /**
     * transport instance
     */
    readonly transport: Transport;
    /**
     * debug mode
     */
    readonly debug: boolean;

    /**
     * current user
     */
    user?: ClientUser;
    /**
     * current application
     */
    application?: APIApplication;

    /**
     * @hidden
     */
    cdnHost: string = "https://cdn.discordapp.com";
    /**
     * @hidden
     */
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

    private throwRPCError(ctx: { code: RPC_ERROR_CODE; message?: string }) {
        throw new RPCError(ctx.code, ctx.message);
    }

    /**
     * @hidden
     */
    async requestWithError<A = any, D = any>(cmd: RPC_CMD, args?: any, evt?: RPC_EVT): Promise<CommandIncoming<A, D>> {
        const response = await this.request<A, D>(cmd, args, evt);

        if (response.evt == "ERROR") this.throwRPCError(response.data as any);

        return response;
    }

    // #region Request Handlers

    /**
     * @hidden
     */
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

    /**
     * @hidden
     */
    async request<A = any, D = any>(cmd: RPC_CMD, args?: any, evt?: RPC_EVT): Promise<CommandIncoming<A, D>> {
        return new Promise((resolve, reject) => {
            const nonce = uuidv4();

            this.transport.send({ cmd, args, evt, nonce });
            this._nonceMap.set(nonce, { resolve, reject });
        });
    }

    // #endregion

    // #region Authorization handlers

    private async authenticate(): Promise<void> {
        const { application, user } = (
            await this.requestWithError("AUTHENTICATE", { access_token: this.accessToken ?? "" })
        ).data;
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

    private async authorize(options: AuthorizeOptions): Promise<void> {
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
            await this.requestWithError("AUTHORIZE", {
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

    // #endregion

    /**
     * Used to subscribe to events. `evt` of the payload should be set to the event being subscribed to. `args` of the payload should be set to the args needed for the event.
     * @param event event name now subscribed to
     * @param args args for the event
     * @returns an object to unsubscribe from the event
     */
    async subscribe(event: Exclude<RPC_EVT, "READY" | "ERROR">, args?: any): Promise<{ unsubscribe: () => void }> {
        await this.requestWithError("SUBSCRIBE", args, event);
        return {
            /**
             * Unsubscribes from the event
             */
            unsubscribe: () => this.requestWithError("UNSUBSCRIBE", args, event)
        };
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * connect to the local rpc server
     */
    async connect(): Promise<void> {
        if (this.connectionPromise) return this.connectionPromise;

        this.connectionPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(
                () => reject(new RPCError(CUSTOM_RPC_ERROR_CODE.RPC_CONNECTION_TIMEOUT, "Connection timed out")),
                10e3
            );
            timeout.unref();

            this.once("connected", () => {
                clearTimeout(timeout);
                resolve();
            });

            this.transport.once("close", () => {
                this._nonceMap.forEach((promise) => {
                    promise.reject(new RPCError(CUSTOM_RPC_ERROR_CODE.RPC_CONNECTION_ENDED, "Connection ended"));
                });
                this.emit("disconnected");
                reject(
                    new RPCError(CUSTOM_RPC_ERROR_CODE.RPC_CONNECTION_ENDED, "[RPC_CONNECTION_ENDED]: Connection ended")
                );
            });

            this.transport.connect();
        });

        return this.connectionPromise;
    }

    /**
     * will try to authorize if a scope is specified, else it's the same as `connect()`
     * @param options options for the authorization
     */
    async login(options?: AuthorizeOptions): Promise<void> {
        await this.connect();

        if (!options || !options.scopes) {
            this.emit("ready");
            return;
        }

        await this.authorize(options);
        await this.authenticate();
    }

    /**
     * disconnects from the local rpc server
     */
    async destroy(): Promise<void> {
        if (this.refrestTimeout) {
            clearTimeout(this.refrestTimeout);
            this.refrestTimeout = undefined;
        }

        await this.transport.close();
    }
}
