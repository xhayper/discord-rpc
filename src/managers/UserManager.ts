import { RawUserData, User, UserResolvable } from "../structures/User";
import { CachedManager } from "./CachedManager";
import { Routes } from "discord-api-types/v10";
import { BaseFetchOptions } from "../types";
import { Client } from "../client/Client";

export class UserManager extends CachedManager<User> {
    constructor(public readonly client: Client, iterable?: Iterable<RawUserData>) {
        super(client, User, iterable);
    }

    public async fetch(
        user: UserResolvable,
        { cache, force }: BaseFetchOptions = { cache: true, force: false }
    ): Promise<User> {
        const id = this.resolveId(user);

        if (!id) throw new Error("Invalid user resolvable");

        if (!force) {
            const existing = this.cache.get(id);
            if (existing) return existing;
        }

        const data = await this.client.rest.get(Routes.user(id));
        return this._add(data, cache);
    }
    // public fetchFlags(user: UserResolvable, options?: BaseFetchOptions): Promise<UserFlags>;
}
