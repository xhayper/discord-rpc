import { EventEmitter } from "events";
import TypedEmitter from "typed-emitter";
import { Client } from "../Client";

/**
 * @see [Opcodes and Status Codes - Discord Developer Portal](https://discord.com/developers/docs/topics/opcodes-and-status-codes#rpc-rpc-close-event-codes)
 */
export enum RPC_CLOSE_CODE {
    /**
     * You connected to the RPC server with an invalid client ID.
     */
    RPC_CLOSE_INVALID_CLIENT_ID = 4000,
    /**
     * You connected to the RPC server with an invalid origin.
     */
    RPC_CLOSE_INVALID_ORIGIN = 4001,
    /**
     * You are being rate limited.
     */
    RPC_CLOSE_RATE_LIMITED = 4002,
    /**
     * The OAuth2 token associated with a connection was revoked, get a new one!
     */
    RPC_CLOSE_TOKEN_REVOKED = 4003,
    /**
     * The RPC Server version specified in the connection string was not valid.
     */
    RPC_CLOSE_INVALID_VERSION = 4004,
    /**
     * The encoding specified in the connection string was not valid
     */
    RPC_CLOSE_INVALID_ENCODING = 4005
}

export enum RPC_ERROR_CODE {
    /**
     * An unknown error occurred.
     */
    RPC_UNKNOWN_ERROR = 1000,
    /**
     * You sent an invalid payload.
     */
    RPC_INVALID_PAYLOAD = 4000,
    /**
     * Invalid command name specified.
     */
    RPC_INVALID_COMMAND = 4002,
    /**
     * Invalid guild ID specified.
     */
    RPC_INVALID_GUILD = 4003,
    /**
     * Invalid event name specified.
     */
    RPC_INVALID_EVENT = 4004,
    /**
     * Invalid channel ID specified.
     */
    RPC_INVALID_CHANNEL = 4005,
    /**
     * You lack permissions to access the given resource.
     */
    RPC_INVALID_PERMISSION = 4006,
    /**
     * An invalid OAuth2 application ID was used to authorize or authenticate with.
     */
    RPC_INVALID_CLIENT_ID = 4007,
    /**
     * An invalid OAuth2 application origin was used to authorize or authenticate with.
     */
    RPC_INVALID_ORIGIN = 4008,
    /**
     * An invalid OAuth2 token was used to authorize or authenticate with.
     */
    RPC_INVALID_TOKEN = 4009,
    /**
     * The specified user ID was invalid.
     */
    RPC_INVALID_USER = 4010,
    /**
     * A standard OAuth2 error occurred; check the data object for the OAuth2 error details.
     */
    RPC_OAUTH2_ERROR = 5000,
    /**
     * An asynchronous `SELECT_TEXT_CHANNEL`/`SELECT_VOICE_CHANNEL` command timed out.
     */
    RPC_SELECT_CHANNEL_TIMEOUT = 5001,
    /**
     * An asynchronous `GET_GUILD` command timed out.
     */
    RPC_GET_GUILD_TIMEOUT = 5002,
    /**
     * You tried to join a user to a voice channel but the user was already in one.
     */
    RPC_SELECT_VOICE_FORCE_REQUIRED = 5003,
    /**
     * You tried to capture more than one shortcut key at once.
     */
    RPC_CAPTURE_SHORTCUT_ALREADY_LISTENING = 5004
}

export enum CUSTOM_RPC_ERROR_CODE {
    RPC_CONNECTION_ENDED,
    RPC_CONNECTION_TIMEOUT
}

export type RPC_CMD =
    /**
     * event dispatch
     */
    | "DISPATCH"
    /**
     * used to authorize a new client with your app
     */
    | "AUTHORIZE"
    /**
     * used to authenticate an existing client with your app
     */
    | "AUTHENTICATE"
    /**
     * used to retrieve guild information from the client
     */
    | "GET_GUILD"
    /**
     * used to retrieve a list of guilds from the client
     */
    | "GET_GUILDS"
    /**
     * used to retrieve channel information from the client
     */
    | "GET_CHANNEL"
    /**
     * used to retrieve a list of channels for a guild from the client
     */
    | "GET_CHANNELS"
    | "CREATE_CHANNEL_INVITE"
    | "GET_RELATIONSHIPS"
    | "GET_USER"
    /**
     * used to subscribe to an RPC event
     */
    | "SUBSCRIBE"
    /**
     * used to unsubscribe from an RPC event
     */
    | "UNSUBSCRIBE"
    /**
     * used to change voice settings of users in voice channels
     */
    | "SET_USER_VOICE_SETTINGS"
    /**
     * used to change voice settings of users in voice channels
     */
    | "SET_USER_VOICE_SETTINGS_2"
    /**
     * used to join or leave a voice channel, group dm, or dm
     */
    | "SELECT_VOICE_CHANNEL"
    /**
     * used to get the current voice channel the client is in
     */
    | "GET_SELECTED_VOICE_CHANNEL"
    /**
     * used to join or leave a text channel, group dm, or dm
     */
    | "SELECT_TEXT_CHANNEL"
    /**
     * used to retrieve the client's voice settings
     */
    | "GET_VOICE_SETTINGS"
    /**
     * used to set the client's voice settings
     */
    | "SET_VOICE_SETTINGS_2"
    /**
     * used to set the client's voice settings
     */
    | "SET_VOICE_SETTINGS"
    | "CAPTURE_SHORTCUT"
    /**
     * used to update a user's Rich Presence
     */
    | "SET_ACTIVITY"
    /**
     * used to consent to a Rich Presence Ask to Join request
     */
    | "SEND_ACTIVITY_JOIN_INVITE"
    /**
     * used to reject a Rich Presence Ask to Join request
     */
    | "CLOSE_ACTIVITY_JOIN_REQUEST"
    | "ACTIVITY_INVITE_USER"
    | "ACCEPT_ACTIVITY_INVITE"
    | "INVITE_BROWSER"
    | "DEEP_LINK"
    | "CONNECTIONS_CALLBACK"
    | "BRAINTREE_POPUP_BRIDGE_CALLBACK"
    | "GIFT_CODE_BROWSER"
    | "GUILD_TEMPLATE_BROWSER"
    | "OVERLAY"
    | "BROWSER_HANDOFF"
    /**
     * used to send info about certified hardware devices
     */
    | "SET_CERTIFIED_DEVICES"
    | "GET_IMAGE"
    | "CREATE_LOBBY"
    | "UPDATE_LOBBY"
    | "DELETE_LOBBY"
    | "UPDATE_LOBBY_MEMBER"
    | "CONNECT_TO_LOBBY"
    | "DISCONNECT_FROM_LOBBY"
    | "SEND_TO_LOBBY"
    | "SEARCH_LOBBIES"
    | "CONNECT_TO_LOBBY_VOICE"
    | "DISCONNECT_FROM_LOBBY_VOICE"
    | "SET_OVERLAY_LOCKED"
    | "OPEN_OVERLAY_ACTIVITY_INVITE"
    | "OPEN_OVERLAY_GUILD_INVITE"
    | "OPEN_OVERLAY_VOICE_SETTINGS"
    | "VALIDATE_APPLICATION"
    | "GET_ENTITLEMENT_TICKET"
    | "GET_APPLICATION_TICKET"
    | "START_PURCHASE"
    /**
     * @deprecated
     */
    | "GET_SKUS"
    | "GET_ENTITLEMENTS"
    | "GET_NETWORKING_CONFIG"
    | "NETWORKING_SYSTEM_METRICS"
    | "NETWORKING_PEER_METRICS"
    | "NETWORKING_CREATE_TOKEN"
    | "SET_USER_ACHIEVEMENT"
    | "GET_USER_ACHIEVEMENTS";

export type RPC_EVT =
    | "CURRENT_USER_UPDATE"
    /**
     * sent when a subscribed server's state changes
     */
    | "GUILD_STATUS"
    /**
     * sent when a guild is created/joined on the client
     */
    | "GUILD_CREATE"
    /**
     * sent when a channel is created/joined on the client
     */
    | "CHANNEL_CREATE"
    | "RELATIONSHIP_UPDATE"
    /**
     * sent when the client joins a voice channel
     */
    | "VOICE_CHANNEL_SELECT"
    /**
     * sent when a user joins a subscribed voice channel
     */
    | "VOICE_STATE_CREATE"
    /**
     * sent when a user parts a subscribed voice channel
     */
    | "VOICE_STATE_DELETE"
    /**
     * sent when a user's voice state changes in a subscribed voice channel (mute, volume, etc.)
     */
    | "VOICE_STATE_UPDATE"
    /**
     * sent when the client's voice settings update
     */
    | "VOICE_SETTINGS_UPDATE"
    /**
     * sent when the client's voice settings update
     */
    | "VOICE_SETTINGS_UPDATE_2"
    /**
     * sent when the client's voice connection status changes
     */
    | "VOICE_CONNECTION_STATUS"
    /**
     * sent when a user in a subscribed voice channel speaks
     */
    | "SPEAKING_START"
    /**
     * sent when a user in a subscribed voice channel stops speaking
     */
    | "SPEAKING_STOP"
    | "GAME_JOIN"
    | "GAME_SPECTATE"
    /**
     * sent when the user clicks a Rich Presence join invite in chat to join a game
     */
    | "ACTIVITY_JOIN"
    /**
     * sent when the user receives a Rich Presence Ask to Join request
     */
    | "ACTIVITY_JOIN_REQUEST"
    /**
     * sent when the user clicks a Rich Presence spectate invite in chat to spectate a game
     */
    | "ACTIVITY_SPECTATE"
    | "ACTIVITY_INVITE"
    /**
     * sent when the client receives a notification (mention or new message in eligible channels)
     */
    | "NOTIFICATION_CREATE"
    /**
     * sent when a message is created in a subscribed text channel
     */
    | "MESSAGE_CREATE"
    /**
     * sent when a message is updated in a subscribed text channel
     */
    | "MESSAGE_UPDATE"
    /**
     * sent when a message is deleted in a subscribed text channel
     */
    | "MESSAGE_DELETE"
    | "LOBBY_DELETE"
    | "LOBBY_UPDATE"
    | "LOBBY_MEMBER_CONNECT"
    | "LOBBY_MEMBER_DISCONNECT"
    | "LOBBY_MEMBER_UPDATE"
    | "LOBBY_MESSAGE"
    | "CAPTURE_SHORTCUT_CHANGE"
    | "OVERLAY"
    | "OVERLAY_UPDATE"
    | "ENTITLEMENT_CREATE"
    | "ENTITLEMENT_DELETE"
    | "USER_ACHIEVEMENT_UPDATE"
    /**
     * non-subscription event sent immediately after connecting, contains server information
     */
    | "READY"
    /**
     * non-subscription event sent when there is an error, including command responses
     */
    | "ERROR";

export interface CommandOutgoing<A = any> {
    cmd: RPC_CMD;
    nonce: string | null;
    args: A;
    evt?: RPC_EVT;
}

export interface CommandIncoming<A = any, D = any> {
    cmd: RPC_CMD;
    nonce: string | null;
    args?: A;
    data: D;
    evt?: RPC_EVT;
}

export type TransportEvents = {
    /**
     * @event
     */
    message: (message: CommandIncoming) => void;
    /**
     * @event
     */
    ping: () => void;
    /**
     * @event
     */
    open: () => void;
    /**
     * @event
     */
    close: () => void;
};

export type TransportOptions = {
    client: Client;
};

export abstract class Transport extends (EventEmitter as new () => TypedEmitter<TransportEvents>) {
    readonly client: Client;

    constructor(options: TransportOptions) {
        super();
        this.client = options.client;
    }

    abstract connect(): Promise<void>;
    abstract send(data?: any): void;
    abstract ping(): void;
    abstract close(): Promise<void>;
}
