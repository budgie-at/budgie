export interface AccountSyncCursorInterface {
    readonly accountId: number;
    readonly accountName: string;
    readonly externalAccountId: string;
    readonly enabled: boolean;
    readonly fromTime: Date;
    readonly toTime: Date;
    readonly startedAt: Date | null;
    readonly completedAt: Date | null;
    readonly completed: boolean;
    readonly transactionCount: number;
    readonly historySyncedTill: Date | null;
}

export const emptyAccountSyncCursor = (): AccountSyncCursorInterface => ({
    accountId: 0,
    accountName: '',
    externalAccountId: '',
    enabled: true,
    fromTime: new Date(0),
    toTime: new Date(0),
    startedAt: null,
    completedAt: null,
    completed: false,
    transactionCount: 0,
    historySyncedTill: null
});
