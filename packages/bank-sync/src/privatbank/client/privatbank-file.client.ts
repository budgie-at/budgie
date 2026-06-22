import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { privatbankAccountMapper } from '../mapper/privatbank-account.mapper';
import { privatbankTransactionMapper } from '../mapper/privatbank-transaction.mapper';
import { parsePrivatbankXlsx } from '../util/parse-privatbank-xlsx.util';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';
import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { PrivatbankRowInterface } from '../interface/privatbank-row.interface';

export class PrivatbankFileClient {
    private readonly rows: PrivatbankRowInterface[];

    constructor(buffer: Uint8Array) {
        this.rows = parsePrivatbankXlsx(buffer);
    }

    @Log('enter', result => `done count=${result.length}`, error => `throw error=${getErrorMessage(error)}`)
    getAccounts(): BankAccountInterface[] {
        return privatbankAccountMapper(this.rows);
    }

    @Log(
        accountId => `enter accountId=${accountId}`,
        (result, accountId) => `done accountId=${accountId} count=${result.length}`,
        (error, accountId) => `throw accountId=${accountId} error=${getErrorMessage(error)}`
    )
    getTransactions(accountId: string): BankTransactionInterface[] {
        return this.rows.filter(row => row.card === accountId).map(privatbankTransactionMapper);
    }
}
