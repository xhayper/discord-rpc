import { Client } from "..";
import { CMD, CommandIncoming, EVT, Transport } from "../structures/transport";
import fs from "fs";
import path from "path";
import net from "net";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

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

export type IPCTransportOptions = {
    formatPathFunction?: (id: number, snap?: boolean) => string;
}

export const createPacket = (opcode: OPCODE, data?: any): Buffer => {
    const dataBuffer = data ? Buffer.from(JSON.stringify(data)) : Buffer.alloc(0);

    const packet = Buffer.alloc(8);
    packet.writeUInt32LE(opcode, 0);
    packet.writeUInt32LE(dataBuffer.length, 4);

    return Buffer.concat([packet, dataBuffer]);
}

export const parsePacket = (packet: Buffer): { op: OPCODE, length: number, data?: CommandIncoming } => {
    const op = packet.readUInt32LE(0);
    const length = packet.readUInt32LE(4);
    const data = length > 0 ? JSON.parse(packet.subarray(8).toString()) : null;

    return { op, length, data };
}

const formatPath = (id: number, snap: boolean = false): string => {
    if (process.platform === 'win32') return `\\\\?\\pipe\\discord-ipc-${id}`;

    const { env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP } } = process;
    const prefix = fs.realpathSync(XDG_RUNTIME_DIR || TMPDIR || TMP || TEMP || `${path.sep}tmp`);
    return `${prefix}${snap ? `${path.sep}snap.discord` : ""}${path.sep}discord-ipc-${id}`;
}

const createSocket = async (path: string): Promise<net.Socket> => {
    return new Promise((resolve, reject) => {
        const onError = () => {
            socket.removeListener("conect", onConnect);
            reject();
        };

        const onConnect = () => {
            socket.removeListener("error", onError);
            resolve(socket);
        }

        const socket = net.createConnection(path);

        socket.once("connect", onConnect)
        socket.once("error", onError);
    });
};

export class IPCTransport extends Transport {
    options: IPCTransportOptions;
    private socket?: net.Socket;

    constructor(client: Client, options?: IPCTransportOptions) {
        super(client)

        this.options = options || {};
    }

    private async getSocket(): Promise<net.Socket> {
        if (this.socket) return this.socket;

        const formatFunc = this.options.formatPathFunction || formatPath;
        return new Promise(async (resolve, reject) => {
            for (let i = 0; i < 10; i++) {
                let socket = await createSocket(formatFunc(i)).catch(() => null);

                if (socket) {
                    resolve(socket);
                    return;
                } else if (process.platform === 'linux') {
                    socket = await createSocket(formatFunc(i, true)).catch(() => null);
                    if (socket) { resolve(socket); return; }
                }
            }

            reject(new Error('Could not connect'));
        });
    }

    async connect(): Promise<void> {
        this.socket = await this.getSocket().catch((err) => { throw err });

        this.emit("open");

        this.send({
            v: 1,
            client_id: this.client.clientId,
        }, OPCODE.HANDSHAKE);

        this.socket.pause();

        this.socket.on("readable", async () => {
            if (!this.socket) return;

            const data = this.socket.read();
            if (!data) return;

            const packet = parsePacket(data);
            console.log(packet);

            switch (packet.op) {
                case OPCODE.FRAME: {
                    if (!packet.data) break;

                    if (packet.data.cmd === 'AUTHORIZE' && packet.data.evt !== 'ERROR') {
                        for (let i = 0; i < 10; i++) {
                            const response = await axios.get(`http://127.0.0.1:${6463 + i}`).catch(() => null);
                            if (!response || response.status == 404) continue;
                            this.client.endPoint = `http://127.0.0.1:${6463 + i}`;
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
        console.log(message, op);
        this.socket?.write(createPacket(op, message));
    }

    ping(): void {
        this.send(uuidv4(), OPCODE.PING);
    }

    close(): Promise<void> {
        return new Promise((resolve) => {
            this.once('close', resolve);
            this.send({}, OPCODE.CLOSE);
            this.socket?.end();
        })
    }

}