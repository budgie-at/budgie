const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/gu, '_');

export const BankSyncRepairsPageSelector = {
    Container: 'BankSyncRepairsPage.Container',
    EmptyState: 'BankSyncRepairsPage.EmptyState',
    ErrorRetryButton: 'BankSyncRepairsPage.ErrorRetryButton',
    ErrorText: 'BankSyncRepairsPage.ErrorText',
    RepairButton: 'BankSyncRepairsPage.RepairButton',
    SourceRow: (source: string) => `BankSyncRepairsPage.SourceRow.${normalizePart(source)}` as const
} as const;
