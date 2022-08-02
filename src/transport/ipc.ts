import axios from "axios";
import fs from "fs";
import net from "net";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Transport, TransportOptions } from "../structures/Transport";

export enum OPCODE {
    HANDSHAKE,
    FRAME,
    CLOSE,
    PING,
    PONG
}

/*
00000000  28000000 7B2276223A312C22 (trimmed)
^^^^^^^^  ^^^^^^^^ ^^^^^^^^^^^^^^^^
OPCODE 0   Length     JSON Data
HANDSHAKE 40bytes  { " v " : 1 , " 
*/

///////////////////////////////////////////////////////////////////////////////////////////////////

export type FormatFunction = (id: number) => string;

export type IPCTransportOptions = {
    pathList?: FormatFunction[];
} & TransportOptions;

// https://github.com/discordjs/RPC/pull/152
// https://github.com/Snazzah/SublimeDiscordRP/blob/c13e60cdbc5de8147881bb232f2339722c2b46b4/discord_ipc/__init__.py#L208
const defaultPathList: FormatFunction[] = [
    (id: number): string => {
        // Windows path

        return process.platform === "win32" ? `\\\\?\\pipe\\discord-ipc-${id}` : "";
    },
    (id: number): string => {
        // macOS/Linux path

        const {
            env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP }
        } = process;

        const prefix = fs.realpathSync(XDG_RUNTIME_DIR || TMPDIR || TMP || TEMP || `${path.sep}tmp`);
        return path.join(prefix, `discord-ipc-${id}`);
    },
    (id: number): string => {
        // Snap path

        const {
            env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP }
        } = process;

        const prefix = fs.realpathSync(XDG_RUNTIME_DIR || TMPDIR || TMP || TEMP || `${path.sep}tmp`);
        return path.join(prefix, "snap.discord", `discord-ipc-${id}`);
    },
    (id: number): string => {
        // Alternative snap path

        const {
            env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP }
        } = process;

        const prefix = fs.realpathSync(XDG_RUNTIME_DIR || TMPDIR || TMP || TEMP || `${path.sep}tmp`);
        return path.join(prefix, "app", "com.discordapp.Discord", `discord-ipc-${id}`);
    }
];

const createSocket = async (path: string): Promise<net.Socket> => {
    return new Promise((resolve, reject) => {
        const onError = () => {
            socket.removeListener("conect", onConnect);
            reject();
        };

        const onConnect = () => {
            socket.removeListener("error", onError);
            resolve(socket);
        };

        const socket = net.createConnection(path);

        socket.once("connect", onConnect);
        socket.once("error", onError);
    });
};

export class IPCTransport extends Transport {
    pathList: FormatFunction[] = defaultPathList;

    private socket?: net.Socket;

    constructor(options: IPCTransportOptions) {
        super(options);

        if (options.pathList) this.pathList = options.pathList;
    }

    private async getSocket(): Promise<net.Socket> {
        if (this.socket) return this.socket;

        const pathList = this.pathList;
        return new Promise(async (resolve, reject) => {
            for (const formatFunc of pathList) {
                if (!fs.existsSync(path.dirname(formatFunc(0)))) continue;

                const tryCreateSocket = async (id: number) => {
                    const socket = await createSocket(formatFunc(id)).catch(() => null);
                    if (socket) {
                        resolve(socket);
                        return;
                    }
                };

                if (this.client.instanceId) {
                    await tryCreateSocket(this.client.instanceId);
                } else {
                    for (let i = 0; i < 10; i++) {
                        await tryCreateSocket(i);
                    }
                }
            }

            reject(new Error("Could not connect"));
        });
    }

    async connect(): Promise<void> {
        if (this.socket) return;

        this.socket = await this.getSocket().catch((err) => {
            throw err;
        });

        this.emit("open");

        this.send(
            {
                v: 1,
                client_id: this.client.clientId
            },
            OPCODE.HANDSHAKE
        );

        let chunk = Buffer.alloc(0);
        this.socket.on("readable", async () => {
            if (!this.socket) return;

            let data = this.socket?.read() as Buffer;
            if (!data || 0 >= data.length) return;

            data = chunk.length > 0 ? Buffer.concat([chunk, data]) : data;

            const length = data.readUInt32LE(4);
            const packetLength = length + 8;

            if (data.length != packetLength) {
                if (data.length > packetLength) throw new Error("Recieved a packet bigger than expected");
                chunk = data;
                return;
            } else {
                chunk = Buffer.alloc(0);
            }

            const packet = {
                op: data.readUInt32LE(0),
                length: length,
                data: length > 0 ? JSON.parse(data.subarray(8).toString()) : null // Should not error at all, If it does, open an Issue on GitHub.
            };

            if (this.client.debug) console.debug(`SERVER => CLIENT | OPCODE.${OPCODE[packet.op]} |`, packet.data);

            switch (packet.op) {
                case OPCODE.FRAME: {
                    if (!packet.data) break;

                    if (packet.data.cmd === "AUTHORIZE" && packet.data.evt !== "ERROR") {
                        for (let i = 0; i < 10; i++) {
                            const url = `http://127.0.0.1:${6463 + i}`;

                            const response = await axios.get(url).catch(() => null);
                            if (!response || response.status == 404) continue;

                            this.client.endPoint = url;
                            break;
                        }
                    }

                    this.emit("message", packet.data);
                    break;
                }
                case OPCODE.CLOSE: {
                    this.emit("close");
                    break;
                }
                case OPCODE.PING: {
                    this.send(packet.data, OPCODE.PONG);
                    this.emit("ping");
                    break;
                }
            }
        });
    }

    send(message?: any, op: OPCODE = OPCODE.FRAME): void {
        if (this.client.debug) console.debug(`CLIENT => SERVER | OPCODE.${OPCODE[op]} |`, message);

        const dataBuffer = message ? Buffer.from(JSON.stringify(message)) : Buffer.alloc(0);

        const packet = Buffer.alloc(8);
        packet.writeUInt32LE(op, 0);
        packet.writeUInt32LE(dataBuffer.length, 4);

        this.socket?.write(Buffer.concat([packet, dataBuffer]));
    }

    ping(): void {
        this.send(uuidv4(), OPCODE.PING);
    }

    close(): Promise<void> {
        return new Promise((resolve) => {
            this.once("close", resolve);
            this.send({}, OPCODE.CLOSE);
            this.socket?.end();
        });
    }
}
