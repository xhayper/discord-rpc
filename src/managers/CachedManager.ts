import { Collection } from "@discordjs/collection";
import { DataManager } from "./DataManager";
import { Client } from "../client/Client";
import { Base } from "../structures/Base";
import { Constructable } from "../types";

export abstract class CachedManager<Holds extends Base> extends DataManager<Holds> {
    private _cache: Collection<string, Holds> = new Collection();

    constructor(client: Client, holds: Constructable<Holds>, iterable?: Iterable<any>) {
        super(client, holds);

        if (iterable) {
            for (const item of iterable) {
                this._add(item);
            }
        }
    }

    public get cache() {
        return this._cache;
    }

    protected _add(
        data: any,
        cache: boolean = true,
        { id, extras }: { id?: string; extras: any[] } = { extras: [] }
    ): Holds {
        const existing = this.cache.get(id ?? data.id);

        if (existing) {
            if (cache) {
                existing._patch(data);
                return existing;
            }
            const clone = existing._clone();
            clone._patch(data);
            return clone;
        }

        // @ts-expect-error
        const entry = this.holds ? new this.holds(this.client, data, ...extras) : data;
        if (cache) this.cache.set(id ?? entry.id, entry);
        return entry;
    }
}
