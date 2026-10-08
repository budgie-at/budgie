import { SyncModeEnum, TransactionTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import {
    IBAN_BRIDGE_EUR_AMOUNT,
    IBAN_BRIDGE_OPERATED_AT,
    IBAN_BRIDGE_SOURCE_IBAN,
    IBAN_BRIDGE_TARGET_IBAN,
    IBAN_BRIDGE_UAH_AMOUNT,
    IBAN_BRIDGE_UAH_TO_EUR_RATE
} from './iban-bridge-topology';
import { testDb, testSeedService } from './test-context';

export const stampIbanBridgeTransactions = Effect.fnUntraced(function* (transactionIds: readonly number[], createdAt: number) {
    const placeholders = transactionIds.map(() => '?').join(', ');

    yield* testDb.$client.unsafe(`UPDATE transactions SET created_at = ?, updated_at = ? WHERE id IN (${placeholders})`, [
        createdAt,
        createdAt,
        ...transactionIds
    ]);
    yield* testDb.$client.unsafe(
        `UPDATE transaction_entries SET created_at = ?, updated_at = ? WHERE transaction_id IN (${placeholders})`,
        [createdAt, createdAt, ...transactionIds]
    );
});

export const seedIbanBridgeBalanceAdjustment = Effect.fnUntraced(function* (accountId: number, createdAt: number) {
    const [adjustment] = yield* testDb.$client.unsafe<{ readonly id: number }>(
        `INSERT INTO transactions (type, title, external_id, external_source, operated_at, exchange_rate, from_account_id, to_account_id, comment, updated_by, created_at, updated_at) VALUES (?, ?, NULL, NULL, ?, ?, NULL, ?, ?, NULL, ?, ?) RETURNING id`,
        [TransactionTypeEnum.ADJUSTMENT, 'Balance calibration', createdAt - 60, 1, accountId, '', createdAt, createdAt]
    );
    const sync = yield* testSeedService.sync({
        accountId,
        forwardSyncFromAt: new Date((createdAt - 30) * 1000),
        mode: SyncModeEnum.FORWARD
    });

    yield* testDb.$client.unsafe('UPDATE bank_syncs SET balance_adjustment_transaction_id = ? WHERE id = ?', [adjustment.id, sync.id]);
});

export const seedIbanBridgePrefixArrival = Effect.fnUntraced(function* ({
    bridgeIban,
    externalIdPrefix,
    operatedAt,
    technicalBridgeAccountId,
    transferMccId
}: {
    readonly bridgeIban: string | null;
    readonly externalIdPrefix: string;
    readonly operatedAt: Date;
    readonly technicalBridgeAccountId: number;
    readonly transferMccId: number;
}) {
    const prefixIncome = yield* testSeedService.bankPairIncome(
        { externalId: `${externalIdPrefix}-income`, operatedAt },
        {
            accountId: technicalBridgeAccountId,
            amount: IBAN_BRIDGE_UAH_AMOUNT,
            exchangeRate: IBAN_BRIDGE_UAH_AMOUNT / IBAN_BRIDGE_EUR_AMOUNT,
            mccCategoryId: transferMccId,
            toIban: IBAN_BRIDGE_SOURCE_IBAN
        }
    );
    const prefixExpense = yield* testSeedService.bankPairExpense(
        { externalId: `${externalIdPrefix}-expense`, operatedAt },
        {
            accountId: technicalBridgeAccountId,
            amount: IBAN_BRIDGE_UAH_AMOUNT,
            mccCategoryId: transferMccId,
            toIban: bridgeIban
        }
    );

    return [prefixIncome.id, prefixExpense.id];
});

export const seedIbanBridgeSupersessionCompleteRoute = Effect.fnUntraced(function* ({
    bridgeAccountId,
    bridgeIban,
    completeSourceAmount,
    sourceAccountId,
    targetAccountId,
    transferMccId
}: {
    readonly bridgeAccountId: number;
    readonly bridgeIban: string | null;
    readonly completeSourceAmount: number;
    readonly sourceAccountId: number;
    readonly targetAccountId: number;
    readonly transferMccId: number;
}) {
    const completeExpense = yield* testSeedService.bankPairExpense(
        { externalId: 'supersession-complete-expense', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: sourceAccountId,
            amount: completeSourceAmount,
            exchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE,
            mccCategoryId: transferMccId,
            toIban: bridgeIban
        }
    );
    const completeIncome = yield* testSeedService.bankPairIncome(
        { externalId: 'supersession-complete-income', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: bridgeAccountId,
            amount: IBAN_BRIDGE_UAH_AMOUNT,
            exchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE,
            mccCategoryId: transferMccId,
            toIban: IBAN_BRIDGE_SOURCE_IBAN
        }
    );
    const existingTransfer = yield* testSeedService.directTransfer({
        targetAccountId,
        sourceAccountId: bridgeAccountId,
        operatedAt: IBAN_BRIDGE_OPERATED_AT,
        targetAmount: IBAN_BRIDGE_UAH_AMOUNT,
        sourceAmount: IBAN_BRIDGE_UAH_AMOUNT,
        toIban: IBAN_BRIDGE_TARGET_IBAN,
        consolidationType: null,
        sourceEntryExchangeRate: 1,
        exchangeRate: 1
    });

    return { completeExpense, completeIncome, existingTransfer };
});
