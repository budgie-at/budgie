export interface SyncTableDescriptorOptionsInterface {
    readonly parentProperty: string | null;
    readonly includeOnly: readonly string[] | null;
    readonly omit: readonly string[];
}
