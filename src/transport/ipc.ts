import { Client } from "..";
import { CMD, EVT, Transport } from "../structures/transport";
import fs from "fs";
import path from "path";
import net from "net";
import { v4 as uuidv4 } from "uuid";
import { json } from "stream/consumers";

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