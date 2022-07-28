import { EventEmitter } from "events";
import TypedEmitter from "typed-emitter";
import { Client } from "../client";

type TransportEvents = {
    message: (message: object) => void;
    ping: () => void,
    open: () => void,
    close: () => void
  }

export abstract class Transport extends (EventEmitter as new () => TypedEmitter<TransportEvents>) {
    readonly client: Client;

    constructor(client: Client) {
        super();
        this.client = client;
    }

    abstract connect(): Promise<void>;
    abstract send(data: Buffer): void;
    abstract ping(): void;
    abstract close(): void;
}