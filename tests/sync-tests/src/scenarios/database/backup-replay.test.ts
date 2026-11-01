import {
    AccountBalanceRepository,
    AccountEntityTable,
    AccountTypeEnum,
    InstrumentEntityTable,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    convertFromMicroUnits
} from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { testDb, TestLayer } from '../../harness';
import { snapshotMissingTransferFeeDeltas } from '../../harness/backup-replay/snapshot-missing-transfer-fee-deltas';
import { backupDatabasePath } from '../../harness/scenario/setup';

import type { SQL } from 'drizzle-orm';

const REPLAY_TIMEOUT_MS = 600_000;
const ACCEPTED_ACCOUNT_IDS = new Set(
    String(process.env['BUDGIE_BACKUP_ACCEPT'] ?? '')
        .split(',')
        .filter(isNotEmptyString)
        .map(Number)
);
const LEDGER_SIGN_BY_ENTRY_TYPE: Partial<Record<TransactionEntryTypeEnum, number>> = {
    [TransactionEntryTypeEnum.DEBIT]: 1,
    [TransactionEntryTypeEnum.CREDIT]: -1,
    [TransactionEntryTypeEnum.FEE]: -1
};

const snapshotBalances = Effect.fnUntraced(function* (accountIds: number[]) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    return {
        ledger: yield* accountBalanceRepository.getLedgerBalances(accountIds),
        stored: new Map((yield* accountBalanceRepository.getByAccountIds(accountIds)).map(({ accountId, amount }) => [accountId, amount]))
    };
});

const fetchConsolidationEntries = (consolidationType: TransactionConsolidationTypeEnum, condition: SQL | undefined) =>
    testDb
        .select({
            id: TransactionEntryEntityTable.id,
            accountId: TransactionEntryEntityTable.accountId,
            accountType: AccountEntityTable.type,
            type: TransactionEntryEntityTable.type,
            amount: TransactionEntryEntityTable.amount
        })
        .from(TransactionEntryEntityTable)
        .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
        .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId))
        .where(
            and(
                eq(TransactionEntityTable.consolidationType, consolidationType),
                isNull(TransactionEntityTable.deletedAt),
                isNull(TransactionEntryEntityTable.deletedAt),
                condition
            )
        );

const fetchManualDuplicateEntries = () =>
    fetchConsolidationEntries(
        TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE,
        isNotNull(TransactionEntryEntityTable.originalTransactionId)
    );

const fetchAtmCashMoveEntries = () =>
    fetchConsolidationEntries(
        TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL,
        and(isNull(TransactionEntryEntityTable.originalTransactionId), eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.DEBIT))
    );

const formatAmount = (amount: number | undefined): string => (isDefined(amount) ? convertFromMicroUnits(amount).toFixed(2) : '-');

describe.skipIf(!isDefined(backupDatabasePath))('database/backup-replay', () => {
    it.effect(
        'replays consolidation and the balance rebuild on a migrated real backup moving ledger balances only by removed manual duplicates, ATM cash moves and restored legacy transfer fees',
        () =>
            Effect.gen(function* () {
                const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
                const transferConsolidationService = yield* TransferConsolidationService;
                const accounts = yield* testDb
                    .select({ id: AccountEntityTable.id, title: AccountEntityTable.title, currency: InstrumentEntityTable.code })
                    .from(AccountEntityTable)
                    .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
                    .where(isNull(AccountEntityTable.deletedAt));
                const accountIds = accounts.map(({ id }) => id);
                const before = yield* snapshotBalances(accountIds);
                const manualDuplicateEntryIdsBefore = new Set((yield* fetchManualDuplicateEntries()).map(({ id }) => id));
                const atmCashMoveEntryIdsBefore = new Set((yield* fetchAtmCashMoveEntries()).map(({ id }) => id));

                const missingTransferFeeDeltas = yield* snapshotMissingTransferFeeDeltas();

                yield* transferConsolidationService.consolidate(null);
                yield* accountBalanceIncrementalService.updateAllBalances(false);
                const after = yield* snapshotBalances(accountIds);
                const removedManualDuplicateEntries = (yield* fetchManualDuplicateEntries()).filter(
                    ({ id }) => !manualDuplicateEntryIdsBefore.has(id)
                );
                const addedAtmCashMoveEntries = (yield* fetchAtmCashMoveEntries()).filter(({ id }) => !atmCashMoveEntryIdsBefore.has(id));
                const expectedLedgerDeltas = [
                    ...removedManualDuplicateEntries.map(entry => ({ ...entry, direction: -1 })),
                    ...addedAtmCashMoveEntries.map(entry => ({ ...entry, direction: 1 }))
                ].reduce(
                    (deltas, { accountId, type, amount, direction }) =>
                        deltas.set(accountId, (deltas.get(accountId) ?? 0) + direction * (LEDGER_SIGN_BY_ENTRY_TYPE[type] ?? 0) * amount),
                    missingTransferFeeDeltas
                );
                const rows = accounts.map(({ id, title, currency }) =>
                    [
                        id,
                        title,
                        currency,
                        ...[before.stored, after.stored, before.ledger, after.ledger].map(balances => formatAmount(balances.get(id))),
                        formatAmount(expectedLedgerDeltas.get(id))
                    ].join('\t')
                );

                process.stdout.write(
                    `id\ttitle\tcurrency\tstoredBefore\tstoredAfter\tledgerBefore\tledgerAfter\texpectedDelta\n${rows.join('\n')}\n`
                );

                expect(removedManualDuplicateEntries.filter(({ accountType }) => accountType !== AccountTypeEnum.BANK)).toEqual([]);
                expect(addedAtmCashMoveEntries.filter(({ accountType }) => accountType !== AccountTypeEnum.CASH)).toEqual([]);
                expect(
                    accountIds.filter(
                        id =>
                            !ACCEPTED_ACCOUNT_IDS.has(id) &&
                            (after.ledger.get(id) ?? 0) - (before.ledger.get(id) ?? 0) !== (expectedLedgerDeltas.get(id) ?? 0)
                    )
                ).toEqual([]);
            }).pipe(Effect.provide(TestLayer)),
        REPLAY_TIMEOUT_MS
    );
});
