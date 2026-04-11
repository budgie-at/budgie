import type { ErsteModernInlineTransactionStateInterface } from './erste-modern-inline-transaction-state.interface';
import type { ErsteModernStandardTransactionStateInterface } from './erste-modern-standard-transaction-state.interface';
import type { ErsteRowInterface } from './erste-row.interface';

export interface ErsteModernParseContextInterface {
    readonly transactions: ErsteRowInterface[];
    pendingLeadingLines: string[];
    currentTransaction: ErsteModernInlineTransactionStateInterface | ErsteModernStandardTransactionStateInterface | null;
    isIgnoringNoteBlock: boolean;
}
