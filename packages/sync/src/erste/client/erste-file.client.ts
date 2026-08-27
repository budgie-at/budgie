import { isDefined } from '@rnw-community/shared';

import { ersteMapper } from '../mapper/erste.mapper';
import { ersteParser } from '../parser/erste.parser';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { ErsteAccountInfoInterface } from '../interface/erste-account-info.interface';
import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

export class ErsteFileClient {
    private parsedData: ErsteParsedDataInterface | null = null;

    parse(items: PdfTextItemInterface[]): void {
        this.parsedData = ersteParser.parse(items);
    }

    getAccounts(): SyncAccountInterface[] {
        if (!isDefined(this.parsedData)) {
            return [];
        }

        return [ersteMapper.mapAccount(this.parsedData.account)];
    }

    getTransactions(): SyncTransactionInterface[] {
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
