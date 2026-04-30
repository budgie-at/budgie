import { isDefined } from '@rnw-community/shared';

import { ersteMapper } from '../mapper/erste.mapper';
import { ersteParser } from '../parser/erste.parser';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';
import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { ErsteAccountInfoInterface } from '../interface/erste-account-info.interface';
import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

export class ErsteFileClient {
    private parsedData: ErsteParsedDataInterface | null = null;

    parse(items: PdfTextItemInterface[]): void {
        this.parsedData = ersteParser.parse(items);
    }

    getAccounts(): BankAccountInterface[] {
        if (!isDefined(this.parsedData)) {
            return [];
        }

        return [ersteMapper.mapAccount(this.parsedData.account)];
    }

    getTransactions(): BankTransactionInterface[] {
        if (!isDefined(this.parsedData)) {
            return [];
        }

        const { iban } = this.parsedData.account;

        return this.parsedData.transactions.map(row => ersteMapper.mapTransaction(row, iban));
    }

    getAccountInfo(): ErsteAccountInfoInterface | null {
        return this.parsedData?.account ?? null;
    }
}
