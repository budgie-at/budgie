export interface OpSqliteMigrationJournalEntryInterface {
    readonly breakpoints: boolean;
    readonly idx: number;
    readonly tag: string;
    readonly when: number;
}
