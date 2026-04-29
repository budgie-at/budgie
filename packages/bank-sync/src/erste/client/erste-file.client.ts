import { isDefined } from '@rnw-community/shared';

import { ersteAccountMapper } from '../mapper/erste-account.mapper';
import { ersteTransactionMapper } from '../mapper/erste-transaction.mapper';
import { parseErsteItems } from '../util/parse-erste-items.util';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';
import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { ErsteAccountInfoInterface } from '../interface/erste-account-info.interface';
import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

export class ErsteFileClient {
    private parsedData: ErsteParsedDataInterface | null = null;

    parse(items: PdfTextItemInterface[]): void {
        this.parsedData = parseErsteItems(items);
    }

    getAccounts(): BankAccountInterface[] {
        if (!isDefined(this.parsedData)) {
            return [];
        }

        return [ersteAccountMapper(this.parsedData.account)];
    }

    getTransactions(): BankTransactionInterface[] {
        if (!isDefined(this.parsedData)) {
            return [];
        }

        const { iban } = this.parsedData.account;

        return this.parsedData.transactions.map(row => ersteTransactionMapper(row, iban));
    }

    getAccountInfo(): ErsteAccountInfoInterface | null {
        return this.parsedData?.account ?? null;
    }
}
