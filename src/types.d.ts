export interface BaseFetchOptions {
    cache?: boolean;
    force?: boolean;
}

export type Constructable<T> = abstract new (...args: any[]) => T;
