import { convertToMicroUnits } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { privatbankAccountMapper } from '../mapper/privatbank-account.mapper';
import { privatbankTransactionMapper } from '../mapper/privatbank-transaction.mapper';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncBalanceSnapshotInterface } from '../../core/interface/sync-balance-snapshot.interface';
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

    getBalanceSnapshot(accountId: string): SyncBalanceSnapshotInterface | null {
        const balancedRows = this.rows.filter(
            row => row.card === accountId && row.balanceCurrency === row.cardCurrency && Number.isFinite(row.endBalance)
        );
        const latestTime = Math.max(...balancedRows.map(row => row.date.getTime()));
        const latestRows = balancedRows.filter(row => row.date.getTime() === latestTime);
        const [snapshotRow] = [...latestRows.filter(row => !this.isFollowedBySameTimeRow(row, latestRows)), ...latestRows];

        return isDefined(snapshotRow) ? { at: snapshotRow.date, balance: convertToMicroUnits(snapshotRow.endBalance) } : null;
    }

    private isFollowedBySameTimeRow(row: PrivatbankRowInterface, sameTimeRows: PrivatbankRowInterface[]): boolean {
        return sameTimeRows.some(
            other =>
                other !== row &&
                convertToMicroUnits(other.endBalance) - convertToMicroUnits(other.cardAmount) === convertToMicroUnits(row.endBalance)
        );
    }
}
