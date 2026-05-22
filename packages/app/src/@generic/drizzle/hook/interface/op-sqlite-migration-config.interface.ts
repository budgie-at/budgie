import type { OpSqliteMigrationJournalEntryInterface } from './op-sqlite-migration-journal-entry.interface';

export interface OpSqliteMigrationConfigInterface {
    readonly journal: {
        readonly entries: readonly OpSqliteMigrationJournalEntryInterface[];
    };
    readonly migrations: Readonly<Record<string, string>>;
}
