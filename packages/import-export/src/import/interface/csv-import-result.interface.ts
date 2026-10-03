import type { ImportRowError } from '../error/import-row.error';
import type { TransactionCreateInputInterface } from '@budgie/contracts';

export interface CsvImportResultInterface {
    readonly transactionIds: number[];
    readonly transactions: TransactionCreateInputInterface[];
    readonly rowErrors: ImportRowError[];
}
