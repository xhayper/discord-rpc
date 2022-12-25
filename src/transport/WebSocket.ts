import { CUSTOM_RPC_ERROR_CODE, Transport } from "../structures/Transport";
import { RPCError } from "../utils/RPCError";
import { WebSocket } from "ws";

export class WebSocketTransport extends Transport {
    private ws?: WebSocket;

    get isConnected() {
        return this.ws != undefined && this.ws.readyState === 1;
    }

    connect(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            for (let i = 0; i < 10; i++) {
                const ws = await new Promise<WebSocket>((resolve, reject) => {
                    const socket = new WebSocket(
                        `ws://127.0.0.1:${6463 + i}/?v=1&client_id=${this.client.clientId}&encoding=json`,
                        {
                            origin: this.client.origin
                        }
                    );

                    socket.onopen = () => {
                        socket.onclose = null;
                        socket.onopen = null;

                        resolve(socket);
                    };

                    socket.onerror = () => {
                        socket.onclose = null;
                        socket.onopen = null;

                        reject();
                    };
                }).catch(() => undefined);

                if (ws) {
                    this.ws = ws;
                    resolve();
                    break;
                }
            }

            if (!this.ws)
                reject(new RPCError(CUSTOM_RPC_ERROR_CODE.RPC_COULD_NOT_CONNECT, "Failed to connect to websocket"));

            this.ws!.onmessage = (event) => {
                this.emit("message", JSON.parse(event.data.toString()));
            };

            this.ws!.onclose = (event) => {
                if (!event.wasClean) return;
                this.ws = undefined;
                this.emit("close", event.reason);
            };

            this.ws!.onerror = (event) => {
                try {
                    this.ws?.close();
                } catch {}

                throw event.error;
            };

            this.emit("open");
        });
    }

    send(data?: object | undefined): void {
        this.ws?.send(JSON.stringify(data));
    }

    ping(): void {}

    close(): Promise<void> {
        if (!this.ws) return new Promise((resolve) => void resolve());

        return new Promise((resolve) => {
            this.ws!.once("close", () => {
                this.emit("close", "Closed by client");
                this.ws = undefined;
                resolve();
            });
            this.ws!.close();
        });
    }
}
