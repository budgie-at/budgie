export interface SyncIdentityBackfillRowInterface {
    readonly rowid: number;
    readonly rowKey: string;
    readonly seedKey: string | null;
    readonly bankSource: string | null;
    readonly bankAccountExternalId: string | null;
    readonly bankTransactionExternalId: string | null;
}
