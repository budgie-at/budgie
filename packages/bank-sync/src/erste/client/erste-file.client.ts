import { ersteAccountMapper } from '../mapper/erste-account.mapper';
import { ersteTransactionMapper } from '../mapper/erste-transaction.mapper';
import { parseErstePdf } from '../util/parse-erste-pdf.util';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';
import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';

export class ErsteFileClient {
    private parsedData: ErsteParsedDataInterface | null = null;

    async parse(buffer: Uint8Array): Promise<void> {
        this.parsedData = await parseErstePdf(buffer);
    }

    getAccounts(): BankAccountInterface[] {
        if (!this.parsedData) {
            return [];
        }

        return [ersteAccountMapper(this.parsedData.account)];
    }

    getTransactions(): BankTransactionInterface[] {
        if (!this.parsedData) {
            return [];
        }

        const { iban } = this.parsedData.account;

        return this.parsedData.transactions.map(row => ersteTransactionMapper(row, iban));
    }

    getAccountInfo() {
        return this.parsedData?.account ?? null;
    }
}
