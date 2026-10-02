import { privatbankAccountMapper } from '../mapper/privatbank-account.mapper';
import { privatbankTransactionMapper } from '../mapper/privatbank-transaction.mapper';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { PrivatbankRowInterface } from '../interface/privatbank-row.interface';

export class PrivatbankFileClient {
    constructor(private readonly rows: PrivatbankRowInterface[]) {}

    getAccounts(): SyncAccountInterface[] {
        return privatbankAccountMapper(this.rows);
    }

    getTransactions(accountId: string): SyncTransactionInterface[] {
        return this.rows.filter(row => row.card === accountId).map(privatbankTransactionMapper);
    }
}
