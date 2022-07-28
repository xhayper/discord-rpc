import { Client } from "..";
import { Transport } from "../structures/transport";
import fs from "fs";
import path from "path";
import net from "net";
import { v4 as uuidv4 } from "uuid";
import { json } from "stream/consumers";

// https://robins.one/notes/discord-rpc-documentation.html

export type CMD = "DISPATCH" | "AUTHORIZE" | "AUTHENTICATE" | "GET_GUILD" | "GET_GUILDS" | "GET_CHANNEL" | "GET_CHANNELS" | "CREATE_CHANNEL_INVITE" | "GET_RELATIONSHIPS" | "GET_USER" | "SUBSCRIBE" | "UNSUBSCRIBE" | "SET_USER_VOICE_SETTINGS" | "SET_USER_VOICE_SETTINGS_2" | "SELECT_VOICE_CHANNEL" | "GET_SELECTED_VOICE_CHANNEL" | "SELECT_TEXT_CHANNEL" | "GET_VOICE_SETTINGS" | "SET_VOICE_SETTINGS_2" | "SET_VOICE_SETTINGS" | "CAPTURE_SHORTCUT" | "SET_ACTIVITY" | "SEND_ACTIVITY_JOIN_INVITE" | "CLOSE_ACTIVITY_JOIN_REQUEST" | "ACTIVITY_INVITE_USER" | "ACCEPT_ACTIVITY_INVITE" | "INVITE_BROWSER" | "DEEP_LINK" | "CONNECTIONS_CALLBACK" | "BRAINTREE_POPUP_BRIDGE_CALLBACK" | "GIFT_CODE_BROWSER" | "GUILD_TEMPLATE_BROWSER" | "OVERLAY" | "BROWSER_HANDOFF" | "SET_CERTIFIED_DEVICES" | "GET_IMAGE" | "CREATE_LOBBY" | "UPDATE_LOBBY" | "DELETE_LOBBY" | "UPDATE_LOBBY_MEMBER" | "CONNECT_TO_LOBBY" | "DISCONNECT_FROM_LOBBY" | "SEND_TO_LOBBY" | "SEARCH_LOBBIES" | "CONNECT_TO_LOBBY_VOICE" | "DISCONNECT_FROM_LOBBY_VOICE" | "SET_OVERLAY_LOCKED" | "OPEN_OVERLAY_ACTIVITY_INVITE" | "OPEN_OVERLAY_GUILD_INVITE" | "OPEN_OVERLAY_VOICE_SETTINGS" | "VALIDATE_APPLICATION" | "GET_ENTITLEMENT_TICKET" | "GET_APPLICATION_TICKET" | "START_PURCHASE" | "GET_SKUS" | "GET_ENTITLEMENTS" | "GET_NETWORKING_CONFIG" | "NETWORKING_SYSTEM_METRICS" | "NETWORKING_PEER_METRICS" | "NETWORKING_CREATE_TOKEN" | "SET_USER_ACHIEVEMENT" | "GET_USER_ACHIEVEMENTS"

export type EVT = "CURRENT_USER_UPDATE" | "GUILD_STATUS" | "GUILD_CREATE" | "CHANNEL_CREATE" | "RELATIONSHIP_UPDATE" | "VOICE_CHANNEL_SELECT" | "VOICE_STATE_CREATE" | "VOICE_STATE_DELETE" | "VOICE_STATE_UPDATE" | "VOICE_SETTINGS_UPDATE" | "VOICE_SETTINGS_UPDATE_2" | "VOICE_CONNECTION_STATUS" | "SPEAKING_START" | "SPEAKING_STOP" | "GAME_JOIN" | "GAME_SPECTATE" | "ACTIVITY_JOIN" | "ACTIVITY_JOIN_REQUEST" | "ACTIVITY_SPECTATE" | "ACTIVITY_INVITE" | "NOTIFICATION_CREATE" | "MESSAGE_CREATE" | "MESSAGE_UPDATE" | "MESSAGE_DELETE" | "LOBBY_DELETE" | "LOBBY_UPDATE" | "LOBBY_MEMBER_CONNECT" | "LOBBY_MEMBER_DISCONNECT" | "LOBBY_MEMBER_UPDATE" | "LOBBY_MESSAGE" | "CAPTURE_SHORTCUT_CHANGE" | "OVERLAY" | "OVERLAY_UPDATE" | "ENTITLEMENT_CREATE" | "ENTITLEMENT_DELETE" | "USER_ACHIEVEMENT_UPDATE" | "READY" | "ERROR"

export enum OPCODE {
    HANDSHAKE,
    FRAME,
    CLOSE,
    PING,
    PONG
}

export interface CommandOutgoing {
    cmd: CMD;
    nonce: string;
    args: object;
    evt?: EVT;
}

export interface CommandIncoming {
    cmd: CMD;
    nonce: string | null;
    args?: object;
    data: object;
    evt?: EVT;
}

/*
00000000  28000000 7B2276223A312C22 (trimmed)
^^^^^^^^  ^^^^^^^^ ^^^^^^^^^^^^^^^^
OPCODE 0   Length     JSON Data
HANDSHAKE 40bytes  { " v " : 1 , " 
*/

///////////////////////////////////////////////////////////////////////////////////////////////////

export type IPCTransportOptions = {
    formatPathFunction: (id: number) => string;
}

export const createPacket = (opcode: OPCODE, data?: object): Buffer => {
    const dataBuffer = Buffer.from(data ? JSON.stringify(data) : "");

    const packet = Buffer.alloc(8);
    packet.writeUInt32LE(opcode, 0);
    packet.writeUInt32LE(dataBuffer.length, 4);

    return Buffer.concat([packet, dataBuffer]);
}

export const parsePacket = (packet: Buffer): { op: OPCODE, length: number, data?: object } => {
    const op = packet.readUInt32LE(0);
    const length = packet.readUInt32LE(4);
    const data = length > 0 ? JSON.parse(packet.subarray(8).toString()) : null;

    return { op, length, data };
}

const formatPath = (id: number): string => {
    if (process.platform === 'win32') return `\\\\?\\pipe\\discord-ipc-${id}`;

    const { env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP } } = process;
    const prefix = fs.realpathSync(XDG_RUNTIME_DIR || TMPDIR || TMP || TEMP || `${path.sep}tmp`);
    return `${prefix}${path.sep}discord-ipc-${id}`;
}

const createSocket = async (path: string): Promise<net.Socket> => {
    return await new Promise((resolve, reject) => {
        const onError = () => reject();

        const socket = net.createConnection(path, () => {
            socket.removeListener("error", onError);
            resolve(socket);
        });
        socket.once("error", onError);
    });
};

export class IPCTransport extends Transport {
    options: IPCTransportOptions;
    private socket?: net.Socket;

    constructor(client: Client, options?: IPCTransportOptions) {
        super(client)

        this.options = options || {
            formatPathFunction: formatPath
        }
    }

    private async getSocket(): Promise<net.Socket> {
        if (this.socket) return this.socket;

        const formatFunc = this.options.formatPathFunction;
        return new Promise(async (resolve, reject) => {
            for (let i = 0; i < 10; i++) {
                const socket = await createSocket(formatFunc(i)).catch(() => null);
                if (socket) {
                    resolve(socket);
                    return;
                }
            }

            reject(new Error('Could not connect'));
        });
    }

    async connect(): Promise<void> {
        this.socket = await this.getSocket().catch((err) => { throw err });

        this.emit("open");

        this.socket.write(createPacket(OPCODE.HANDSHAKE, {
            v: 1,
            client_id: this.client.clientId,
        }));

        this.socket.pause();

        this.socket.on("readable", () => {
            if (!this.socket) return;

            const data = this.socket.read();
            if (!data) return;

            const packet = parsePacket(data);

            switch (packet.op) {
                case OPCODE.FRAME: {
                    if (!packet.data) break;

                    this.emit("message", packet.data);
                    break;
                }
                case OPCODE.CLOSE: {
                    this.emit("close");
                    break;
                }
                case OPCODE.PING: {
                    this.send(packet.data ? Buffer.from(JSON.stringify(packet.data)) : undefined, OPCODE.PONG);
                    this.emit("ping");
                    break;
                }
            }
        });
    }

    send(message?: Buffer, op: OPCODE = OPCODE.FRAME): void {
        this.socket?.write(createPacket(op, message || Buffer.alloc(0)));
    }

    ping(): void {
        this.send(Buffer.from(uuidv4()), OPCODE.PING);
    }

    close(): void {
        throw new Error("Method not implemented.");
    }

}