export interface SyncIdentityTableInterface {
    readonly name: string;
    readonly keyExpression: string;
    readonly seedKeyExpression?: string;
    readonly bankColumnsExpression?: string;
}
