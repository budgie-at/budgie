import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { DEFAULT_TRANSACTION_FILTER, DebtEventDirectionEnum, LanguageEnum } from '@budgie/contracts';
import { expect } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import type { TransactionRepository, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export class DebtMigrationTransactionAssertions {
    private static readonly DEBT_ACCOUNT_ID = Number('101');
    private static readonly EXPECTED_FIRST_TRANSACTION_AMOUNT = Number('684');
    private static readonly EXPECTED_TRANSACTION_IDS = ['1001', '1002', '1003', '1004', '1005', '1006', '1007'].map(Number);
    private static readonly FIRST_TRANSACTION_ID = Number('1001');
    private static readonly UAH_INSTRUMENT_ID = 33;

    constructor(private readonly repository: TransactionRepository) {}

    async assert(): Promise<void> {
        const transactions = await this.repository.getAll(
            DebtMigrationTransactionAssertions.EXPECTED_TRANSACTION_IDS.length,
            {
                ...DEFAULT_TRANSACTION_FILTER,
                accountIds: [DebtMigrationTransactionAssertions.DEBT_ACCOUNT_ID],
                date: { from: new Date('2026-06-03T00:00:00.000Z'), to: null }
            },
            LanguageEnum.EN
        );

        this.assertRows(transactions);
        this.assertFirstTransaction(transactions);
    }

    private assertRows(transactions: TransactionWithRelationsEntityInterface[]): void {
        const entries = transactions.flatMap(transaction => transaction.entries);
        const debtEvents = transactions.flatMap(transaction => transaction.debtEvents);

        expect(transactions.map(transaction => transaction.id).sort()).toEqual(DebtMigrationTransactionAssertions.EXPECTED_TRANSACTION_IDS);
        expect(entries).toHaveLength(DebtMigrationTransactionAssertions.EXPECTED_TRANSACTION_IDS.length);
        expect(entries.every(entry => !isDefined(entry.deletedAt))).toBe(true);
        expect(new Set(entries.map(entry => entry.id)).size).toBe(entries.length);
        expect(debtEvents).toHaveLength(DebtMigrationTransactionAssertions.EXPECTED_TRANSACTION_IDS.length);
        expect(debtEvents.every(debtEvent => !isDefined(debtEvent.deletedAt))).toBe(true);
        expect(new Set(debtEvents.map(debtEvent => debtEvent.id)).size).toBe(debtEvents.length);
    }

    private assertFirstTransaction(transactions: TransactionWithRelationsEntityInterface[]): void {
        const firstTransaction = transactions.find(
            transaction => transaction.id === DebtMigrationTransactionAssertions.FIRST_TRANSACTION_ID
        );

        expect(firstTransaction).toBeDefined();

        if (!isDefined(firstTransaction)) {
            throw new Error('Migrated debt history was not hydrated');
        }

        expect(firstTransaction.entries).toHaveLength(1);
        expect(firstTransaction.entries[0]?.deletedAt).toBeNull();
        expect(firstTransaction.entries[0]?.account.instrumentId).toBe(DebtMigrationTransactionAssertions.UAH_INSTRUMENT_ID);
        expect(firstTransaction.debtEvents).toHaveLength(1);
        expect(firstTransaction.debtEvents[0]?.direction).toBe(DebtEventDirectionEnum.CLOSE);
        expect(convertFromMicroUnits(firstTransaction.debtEvents[0]?.amount ?? 0)).toBe(
            DebtMigrationTransactionAssertions.EXPECTED_FIRST_TRANSACTION_AMOUNT
        );
        expect(firstTransaction.debtEvents[0]?.debtAccount.instrumentId).toBe(1);
    }
}
