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
        const terminalRows = latestRows.filter(row => !latestRows.some(other => other !== row && this.isBookedBefore(row, other)));
        const [terminalRow] = terminalRows;

        if (terminalRows.length !== 1 || !isDefined(terminalRow)) {
            return null;
        }

        return {
            at: terminalRow.date,
            balance: convertToMicroUnits(terminalRow.endBalance),
            precedingSameSecondBalances: this.collectPrecedingBalances(terminalRow, latestRows)
        };
    }

    private isBookedBefore(row: PrivatbankRowInterface, next: PrivatbankRowInterface): boolean {
        return convertToMicroUnits(next.endBalance) - convertToMicroUnits(next.cardAmount) === convertToMicroUnits(row.endBalance);
    }

    private collectPrecedingBalances(terminalRow: PrivatbankRowInterface, sameSecondRows: PrivatbankRowInterface[]): number[] {
        const reachedRows = new Set([terminalRow]);
        const pendingRows = [terminalRow];

        for (let currentRow = pendingRows.pop(); isDefined(currentRow); currentRow = pendingRows.pop()) {
            for (const row of sameSecondRows) {
                if (!reachedRows.has(row) && this.isBookedBefore(row, currentRow)) {
                    reachedRows.add(row);
                    pendingRows.push(row);
                }
            }
        }

        reachedRows.delete(terminalRow);

        return [...reachedRows].map(row => convertToMicroUnits(row.endBalance));
    }
}
