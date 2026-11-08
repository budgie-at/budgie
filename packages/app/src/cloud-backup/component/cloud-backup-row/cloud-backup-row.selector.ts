export const CloudBackupRowSelector = {
    Root: (recordName: string) => `CloudBackupRow.${recordName}`,
    RetryButton: (recordName: string) => `CloudBackupRow.${recordName}.RetryButton`
} as const;
