import { CUSTOM_RPC_ERROR_CODE, Transport, type TransportOptions } from "../structures/Transport";
import { RPCError } from "../utils/RPCError";
import crypto from "node:crypto";
import path from "node:path";
import net from "node:net";
import fs from "node:fs";

export enum IPC_OPCODE {
    HANDSHAKE,
    FRAME,
    CLOSE,
    PING,
    PONG
}

export type FormatFunction = (id: number) => string;
export type PathData = { platform: NodeJS.Platform[]; format: FormatFunction };

export type IPCTransportOptions = {
    pathList?: PathData[];
} & TransportOptions;

const defaultPathList: PathData[] = [
    {
        platform: ["win32"],
        format: (id: number): string => `\\\\?\\pipe\\discord-ipc-${id}`
    },
    {
        platform: ["darwin", "linux"],
        format: (id: number): string => {
            // macOS / Linux path

            const {
                env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP }
            } = process;

            const prefix = fs.realpathSync(XDG_RUNTIME_DIR ?? TMPDIR ?? TMP ?? TEMP ?? `${path.sep}tmp`);
            return path.join(prefix, `discord-ipc-${id}`);
        }
    },
    {
        platform: ["linux"],
        format: (id: number): string => {
            // snap

            const {
                env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP }
            } = process;

            const prefix = fs.realpathSync(XDG_RUNTIME_DIR ?? TMPDIR ?? TMP ?? TEMP ?? `${path.sep}tmp`);
            return path.join(prefix, "snap.discord", `discord-ipc-${id}`);
        }
    },
    {
        platform: ["linux"],
        format: (id: number): string => {
            // flatpak

            const {
                env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP }
            } = process;

            const prefix = fs.realpathSync(XDG_RUNTIME_DIR ?? TMPDIR ?? TMP ?? TEMP ?? `${path.sep}tmp`);
            return path.join(prefix, "app", "com.discordapp.Discord", `discord-ipc-${id}`);
        }
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
    pathList: PathData[];

    private socket?: net.Socket;

    override get isConnected() {
        return this.socket !== undefined && this.socket.readyState === "open";
    }

    constructor(options: IPCTransportOptions) {
        super(options);

        this.pathList = options.pathList ?? defaultPathList;
    }

    private async getSocket(): Promise<net.Socket> {
        if (this.socket) return this.socket;

        const pathList = this.pathList ?? defaultPathList;

        const pipeId = this.client.pipeId;

        return new Promise(async (resolve, reject) => {
            for (const pat of pathList) {
                const tryCreateSocket = async (path: string) => {
                    const socket = await createSocket(path).catch(() => undefined);
                    return socket;
                };

                const handleSocketId = async (id: number): Promise<net.Socket | undefined> => {
                    if (!pat.platform.includes(process.platform)) return;
                    const socketPath = pat.format(id);
                    if (process.platform !== "win32" && !fs.existsSync(path.dirname(socketPath))) return;
                    return await tryCreateSocket(socketPath);
                };

                if (pipeId) {
                    const socket = await handleSocketId(pipeId);
                    if (socket) return resolve(socket);
                } else {
                    for (let i = 0; i < 10; i++) {
                        const socket = await handleSocketId(i);
                        if (socket) return resolve(socket);
                    }
                }
            }

            reject(new RPCError(CUSTOM_RPC_ERROR_CODE.COULD_NOT_CONNECT, "Could not connect"));
        });
    }

    async connect(): Promise<void> {
        if (!this.socket) this.socket = await this.getSocket();

        this.emit("open");

        this.send(
            {
                v: 1,
                client_id: this.client.clientId
            },
            IPC_OPCODE.HANDSHAKE
        );

        this.socket.on("readable", () => {
            let data = Buffer.alloc(0);

            do {
                if (!this.isConnected) break;

                const chunk = this.socket?.read() as Buffer | undefined;
                if (!chunk) break;
                this.client.emit(
                    "debug",
                    `SERVER => CLIENT | ${chunk
                        .toString("hex")
                        .match(/.{1,2}/g)
                        ?.join(" ")
                        .toUpperCase()}`
                );

                data = Buffer.concat([data, chunk]);
            } while (true);

            if (data.length < 8) {
                if (data.length === 0) return;
                // TODO : Handle error
                this.client.emit("debug", "SERVER => CLIENT | Malformed packet, invalid payload");
                return;
            }

            const op = data.readUInt32LE(0);
            const length = data.readUInt32LE(4);

            if (data.length !== length + 8) {
                // TODO : Handle error
                this.client.emit("debug", "SERVER => CLIENT | Malformed packet, invalid payload");
                return;
            }

            let parsedData: any;
            try {
                parsedData = JSON.parse(data.subarray(8, length + 8).toString());
            } catch {
                // TODO : Handle error
                this.client.emit("debug", "SERVER => CLIENT | Malformed packet, invalid payload");
                return;
            }

            this.client.emit("debug", `SERVER => CLIENT | OPCODE.${IPC_OPCODE[op]} |`, parsedData);

            switch (op) {
                case IPC_OPCODE.FRAME: {
                    if (!data) break;

                    this.emit("message", parsedData);
                    break;
                }
                case IPC_OPCODE.CLOSE: {
                    this.emit("close", parsedData);
                    break;
                }
                case IPC_OPCODE.PING: {
                    this.send(parsedData, IPC_OPCODE.PONG);
                    this.emit("ping");
                    break;
                }
            }
        });

        this.socket.on("close", () => {
            this.socket = undefined;
            this.emit("close", "Closed by Discord");
        });
    }

    send(message?: any, op: IPC_OPCODE = IPC_OPCODE.FRAME): void {
        this.client.emit("debug", `CLIENT => SERVER | OPCODE.${IPC_OPCODE[op]} |`, message);

        const dataBuffer = message ? Buffer.from(JSON.stringify(message)) : Buffer.alloc(0);

        const packet = Buffer.alloc(8);
        packet.writeUInt32LE(op, 0);
        packet.writeUInt32LE(dataBuffer.length, 4);

        this.socket?.write(Buffer.concat([packet, dataBuffer]));
    }

    ping(): void {
        this.send(crypto.randomUUID(), IPC_OPCODE.PING);
    }

    close(): Promise<void> {
        if (!this.socket) return Promise.resolve();

        return new Promise((resolve) => {
            this.socket!.once("close", () => {
                this.emit("close", "Closed by client");
                this.socket = undefined;
                resolve();
            });
            this.socket!.end();
        });
    }
}
