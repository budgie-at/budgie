import { privatbankAccountMapper } from '../mapper/privatbank-account.mapper';
import { privatbankTransactionMapper } from '../mapper/privatbank-transaction.mapper';
import { parsePrivatbankXlsx } from '../util/parse-privatbank-xlsx.util';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { PrivatbankRowInterface } from '../interface/privatbank-row.interface';

export class PrivatbankFileClient {
    private readonly rows: PrivatbankRowInterface[];

    constructor(buffer: Uint8Array) {
        this.rows = parsePrivatbankXlsx(buffer);
    }

    getAccounts(): SyncAccountInterface[] {
        return privatbankAccountMapper(this.rows);
    }

    getTransactions(accountId: string): SyncTransactionInterface[] {
        return this.rows.filter(row => row.card === accountId).map(privatbankTransactionMapper);
    }
}
