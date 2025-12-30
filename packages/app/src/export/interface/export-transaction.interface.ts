import { ExportTransactionEntryInterface } from './export-transaction-entry.interface';

export interface ExportTransactionInterface {
    externalId: string | null;
    comment: string;
    operatedAt: Date;
    toAccountId: number | null;
    fromAccountId: number | null;
    entries: ExportTransactionEntryInterface[];
}
