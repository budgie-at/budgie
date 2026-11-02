export interface IconSearchTokenIndexInterface {
    readonly tokens: readonly string[];
    readonly postings: ReadonlyMap<string, readonly number[]>;
}
