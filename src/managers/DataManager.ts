import { Snowflake } from "discord-api-types/globals";
import { Collection } from "@discordjs/collection";
import { BaseManager } from "./BaseManager";
import { Client } from "../client/Client";
import { Base } from "../structures/Base";
import { Constructable } from "../types";

export abstract class DataManager<Holds extends Base> extends BaseManager {
    constructor(public readonly client: Client, public readonly holds: Constructable<Holds>) {
        super(client);
    }

    public get cache(): Collection<string, Holds> {
        // throw new Error(ErrorCodes.NotImplemented, "get cache", this.constructor.name);
        throw new Error();
    }

    public resolve(idOrInstance: string | Holds): Holds | null {
        if (idOrInstance instanceof this.holds) return idOrInstance;
        if (typeof idOrInstance === "string") return this.cache.get(idOrInstance as string) ?? null;
        return null;
    }

    public resolveId(resolvable: string | Holds): Snowflake | null {
        if (resolvable instanceof this.holds) return resolvable.id;
        if (typeof resolvable === "string") return resolvable;
        return null;
    }

    public valueOf() {
        return this.cache;
    }
}
