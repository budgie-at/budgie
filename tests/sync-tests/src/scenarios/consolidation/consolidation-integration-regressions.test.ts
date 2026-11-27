import { RefundConsolidationService } from '@budgie/consolidation';
import {
    AccountBalanceRepository,
    AccountTypeEnum,
    SyncModeEnum,
    SyncRepository,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    convertToMicroUnits
} from '@budgie/contracts';
import {
    AccountArchiveService,
    AccountBalanceIncrementalService,
    TransactionTransferService,
    TransferConsolidationService
} from '@budgie/ledger';
import { TransferConsolidationDrainerService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Fiber from 'effect/Fiber';
import { vi } from 'vitest';

import {
    RealDrainerTestClockLayer,
    TestLayer,
    advanceScheduledDrain,
    assertStoredBalancesMatchLedger,
    fetchAccountBalance,
    fetchBalanceAdjustments,
    fetchCachedBalanceAmount,
    fetchExpenseEntries,
    runRefundScenario,
    seed,
    seedBankPair,
    seedBankSyncAccount,
    testDb,
    testQueryService
} from '../../harness';

const assignSyncId = (transactionId: number, syncId: string) =>
    testDb.update(TransactionEntityTable).set({ syncId }).where(eq(TransactionEntityTable.id, transactionId));

describe('consolidation/consolidation-integration-regressions', () => {
    it.effect('preserves reconciliation adjustment and balances when a refund crosses reconciledAt', () =>
        Effect.gen(function* () {
            const syncRepository = yield* SyncRepository;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const refundConsolidationService = yield* RefundConsolidationService;
            const account = yield* seed.account({ type: AccountTypeEnum.BANK_SYNC });
            const sync = yield* seed.sync({ accountId: account.id, mode: SyncModeEnum.FORWARD });
            const expense = yield* seedBankPair.expense(
                { externalId: 'cross-reconcile-expense', operatedAt: new Date('2026-01-05T12:00:00.000Z') },
                { accountId: account.id, amount: convertToMicroUnits(100) }
            );

            yield* syncRepository.update(sync.id, {
                reconciledAt: new Date('2026-01-10T12:00:00.000Z'),
                reconciledBalance: convertToMicroUnits(500)
            });
            yield* accountBalanceIncrementalService.updateAllBalances(true);

            expect(yield* fetchBalanceAdjustments(account.id)).toMatchObject([
                { amount: convertToMicroUnits(600), type: TransactionEntryTypeEnum.DEBIT }
            ]);

            const refund = yield* seedBankPair.income(
                { externalId: 'cross-reconcile-refund', operatedAt: new Date('2026-01-15T12:00:00.000Z') },
                { accountId: account.id, amount: convertToMicroUnits(40) }
            );

            yield* refundConsolidationService.convertToRefund({
                refundIncomeTransactionId: refund.id,
                expenseTransactionId: expense.id
            });
            yield* accountBalanceIncrementalService.updateAllBalances(true);

            expect(yield* fetchBalanceAdjustments(account.id)).toMatchObject([
                { amount: convertToMicroUnits(600), type: TransactionEntryTypeEnum.DEBIT }
            ]);
            expect(yield* fetchAccountBalance(account.id)).toBe(convertToMicroUnits(540));
            expect(yield* fetchCachedBalanceAmount(account.id)).toBe(convertToMicroUnits(540));
            expect((yield* accountBalanceRepository.getLedgerBalances([account.id])).get(account.id)).toBe(convertToMicroUnits(540));
            yield* assertStoredBalancesMatchLedger(testDb);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects converting a refunded expense to a transfer without losing its moved refund entry', () =>
        Effect.gen(function* () {
            const transactionTransferService = yield* TransactionTransferService;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const { account, expense, refunds } = yield* runRefundScenario({
                expenseAmount: convertToMicroUnits(100),
                refundAmounts: [convertToMicroUnits(40)],
                externalIdPrefix: 'reject-transfer-refund'
            });
            const destinationAccount = yield* seed.account({ title: 'Destination Bank', type: AccountTypeEnum.BANK });

            yield* accountBalanceIncrementalService.updateAllBalances(true);

            const exit = yield* Effect.exit(
                transactionTransferService.convertExpenseToTransfer({
                    id: expense.id,
                    accountId: destinationAccount.id,
                    customExchangeRate: 0,
                    feeEntries: []
                })
            );

            expect(Exit.isFailure(exit)).toBe(true);
            expect(yield* testQueryService.findTransactionById(expense.id)).toMatchObject({
                type: TransactionTypeEnum.EXPENSE,
                consolidationType: TransactionConsolidationTypeEnum.REFUND,
                toAccountId: null
            });

            const entries = yield* fetchExpenseEntries(expense.id);
            expect(entries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT)).toMatchObject([
                { amount: convertToMicroUnits(100), originalTransactionId: null }
            ]);
            expect(entries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT)).toMatchObject([
                { amount: convertToMicroUnits(40), originalTransactionId: refunds[0].id }
            ]);
            expect(yield* fetchAccountBalance(account.id)).toBe(-convertToMicroUnits(60));
            expect(yield* fetchAccountBalance(destinationAccount.id)).toBe(0);
            yield* assertStoredBalancesMatchLedger(testDb);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('peels both outer and resurrected inner canonicals when archiving a participant account', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const accountArchiveService = yield* AccountArchiveService;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const operatedAt = new Date('2026-03-10T10:00:00.000Z');
            const eurAmount = convertToMicroUnits(200);
            const uahAmount = convertToMicroUnits(9000);
            const eurInstrument = yield* seed.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
            const originAccount = yield* seedBankSyncAccount('Origin EUR', null, 'UA-NESTED-ORIGIN', eurInstrument.id);
            const relayAccount = yield* seedBankSyncAccount('Relay UAH', null, 'UA-NESTED-RELAY');
            const receiverAccount = yield* seedBankSyncAccount('Receiver UAH', null, 'UA-NESTED-RECEIVER');

            const relayOutflow = yield* seedBankPair.expense(
                { externalId: 'nested-relay-outflow', operatedAt },
                { accountId: relayAccount.id, amount: uahAmount, toIban: 'UA-NESTED-RECEIVER' }
            );
            const receiverInflow = yield* seedBankPair.income(
                { externalId: 'nested-receiver-inflow', operatedAt },
                { accountId: receiverAccount.id, amount: uahAmount }
            );

            expect(yield* transferConsolidationService.consolidate(null)).toEqual({ found: 1, consolidated: 1 });
            const [innerCanonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(innerCanonical).toMatchObject({ fromAccountId: relayAccount.id, toAccountId: receiverAccount.id });

            const originOutflow = yield* seedBankPair.expense(
                { externalId: 'nested-origin-outflow', operatedAt },
                { accountId: originAccount.id, amount: eurAmount, exchangeRate: eurAmount / uahAmount }
            );
            const relayInflow = yield* seedBankPair.income(
                { externalId: 'nested-relay-inflow', operatedAt },
                { accountId: relayAccount.id, amount: uahAmount, exchangeRate: uahAmount / eurAmount, toIban: 'UA-NESTED-ORIGIN' }
            );

            expect(yield* transferConsolidationService.consolidate(null)).toEqual({ found: 1, consolidated: 1 });
            const [outerCanonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);
            expect(outerCanonical).toMatchObject({ fromAccountId: originAccount.id, toAccountId: receiverAccount.id });
            expect((yield* testQueryService.findTransactionById(innerCanonical.id)).consolidationParentTransactionId).toBe(
                outerCanonical.id
            );

            yield* accountBalanceIncrementalService.updateAllBalances(true);
            yield* accountArchiveService.archiveById(receiverAccount.id);

            expect(
                yield* testDb
                    .select({ id: TransactionEntityTable.id })
                    .from(TransactionEntityTable)
                    .where(and(isNotNull(TransactionEntityTable.consolidationType), isNull(TransactionEntityTable.deletedAt)))
            ).toStrictEqual([]);

            for (const restoredId of [originOutflow.id, relayInflow.id, relayOutflow.id]) {
                expect(yield* testQueryService.findTransactionById(restoredId)).toMatchObject({
                    deletedAt: null,
                    consolidationParentTransactionId: null
                });
            }

            const archivedReceiverInflow = yield* testQueryService.findTransactionById(receiverInflow.id);
            expect(archivedReceiverInflow.consolidationParentTransactionId).toBeNull();
            expect(archivedReceiverInflow.deletedAt).not.toBeNull();

            const balances = yield* accountBalanceRepository.getLedgerBalances([originAccount.id, relayAccount.id]);
            expect(balances.get(originAccount.id)).toBe(-eurAmount);
            expect(balances.get(relayAccount.id)).toBe(0);
            expect(yield* fetchAccountBalance(originAccount.id)).toBe(-eurAmount);
            expect(yield* fetchAccountBalance(relayAccount.id)).toBe(0);
            yield* assertStoredBalancesMatchLedger(testDb);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('merges concurrent drainer scopes without dropping IDs and cancels pending runs cleanly', () =>
        Effect.gen(function* () {
            const drainer = yield* TransferConsolidationDrainerService;
            const transferConsolidationService = yield* TransferConsolidationService;
            const consolidateSpy = vi
                .spyOn(transferConsolidationService, 'consolidate')
                .mockReturnValue(Effect.succeed({ consolidated: 0, found: 0 }));
            const scopeAlpha = {
                operatedAtFrom: new Date('2026-04-02T00:00:00.000Z'),
                operatedAtTo: new Date('2026-04-03T00:00:00.000Z'),
                transactionIds: [11, 12]
            };
            const scopeBeta = {
                operatedAtFrom: new Date('2026-04-01T00:00:00.000Z'),
                operatedAtTo: new Date('2026-04-05T00:00:00.000Z'),
                transactionIds: [12, 13]
            };

            yield* Effect.all([drainer.enqueue(scopeAlpha), drainer.enqueue(scopeBeta)], { concurrency: 'unbounded' });
            yield* advanceScheduledDrain(1500);

            expect(consolidateSpy).toHaveBeenCalledTimes(1);
            expect(consolidateSpy).toHaveBeenCalledWith({
                operatedAtFrom: scopeBeta.operatedAtFrom,
                operatedAtTo: scopeBeta.operatedAtTo,
                transactionIds: [11, 12, 13]
            });

            consolidateSpy.mockClear();

            yield* drainer.enqueue({
                operatedAtFrom: new Date('2026-05-01T00:00:00.000Z'),
                operatedAtTo: new Date('2026-05-02T00:00:00.000Z'),
                transactionIds: [99]
            });
            yield* drainer.cancelPending();
            yield* advanceScheduledDrain(3000);

            expect(consolidateSpy).not.toHaveBeenCalled();
        }).pipe(Effect.provide(RealDrainerTestClockLayer))
    );

    it.effect('re-schedules work enqueued while cancelPending is interrupting an active drain', () =>
        Effect.gen(function* () {
            const drainer = yield* TransferConsolidationDrainerService;
            const transferConsolidationService = yield* TransferConsolidationService;
            const firstDrainGate = yield* Deferred.make<void>();
            const interruptObserved = yield* Deferred.make<void>();
            const releaseInterrupt = yield* Deferred.make<void>();
            const consolidateSpy = vi
                .spyOn(transferConsolidationService, 'consolidate')
                .mockImplementationOnce(() =>
                    Effect.onInterrupt(Effect.as(Deferred.await(firstDrainGate), { consolidated: 0, found: 0 }), () =>
                        Effect.andThen(Deferred.succeed(interruptObserved, undefined), Deferred.await(releaseInterrupt))
                    )
                )
                .mockReturnValue(Effect.succeed({ consolidated: 0, found: 0 }));
            const scopeAlpha = {
                operatedAtFrom: new Date('2026-07-01T00:00:00.000Z'),
                operatedAtTo: new Date('2026-07-02T00:00:00.000Z'),
                transactionIds: [201]
            };
            const scopeBeta = {
                operatedAtFrom: new Date('2026-07-03T00:00:00.000Z'),
                operatedAtTo: new Date('2026-07-04T00:00:00.000Z'),
                transactionIds: [202]
            };

            yield* Effect.ensuring(
                Effect.gen(function* () {
                    yield* drainer.enqueue(scopeAlpha);
                    yield* advanceScheduledDrain(1500);
                    expect(consolidateSpy).toHaveBeenCalledTimes(1);
                    expect(consolidateSpy).toHaveBeenCalledWith(scopeAlpha);

                    const cancelFiber = yield* Effect.forkChild(drainer.cancelPending());
                    yield* Deferred.await(interruptObserved);

                    yield* drainer.enqueue(scopeBeta);
                    yield* Deferred.succeed(releaseInterrupt, undefined);
                    yield* Fiber.join(cancelFiber);

                    yield* advanceScheduledDrain(0);
                    expect(consolidateSpy).toHaveBeenCalledTimes(1);

                    yield* advanceScheduledDrain(1500);

                    expect(consolidateSpy).toHaveBeenCalledTimes(2);
                    expect(consolidateSpy).toHaveBeenLastCalledWith(scopeBeta);
                }),
                Effect.sync(() => {
                    consolidateSpy.mockRestore();
                })
            );
        }).pipe(Effect.provide(RealDrainerTestClockLayer))
    );

    it.effect('keeps the drainer unblocked when an enqueue fiber is interrupted concurrently with follow-up work', () =>
        Effect.gen(function* () {
            const drainer = yield* TransferConsolidationDrainerService;
            const transferConsolidationService = yield* TransferConsolidationService;
            const spy = vi
                .spyOn(transferConsolidationService, 'consolidate')
                .mockReturnValue(Effect.succeed({ consolidated: 0, found: 0 }));
            const interruptedScope = {
                operatedAtFrom: new Date('2026-08-01T00:00:00.000Z'),
                operatedAtTo: new Date('2026-08-02T00:00:00.000Z'),
                transactionIds: [301]
            };
            const followUpScope = {
                operatedAtFrom: new Date('2026-08-03T00:00:00.000Z'),
                operatedAtTo: new Date('2026-08-04T00:00:00.000Z'),
                transactionIds: [302]
            };

            yield* Effect.ensuring(
                Effect.gen(function* () {
                    const enqueueFiber = yield* Effect.forkChild(drainer.enqueue(interruptedScope));
                    yield* Fiber.interrupt(enqueueFiber);

                    yield* drainer.enqueue(followUpScope);
                    yield* advanceScheduledDrain(1500);

                    expect(spy).toHaveBeenCalledTimes(1);
                    expect(spy.mock.calls[0]?.[0]?.transactionIds).toContain(302);
                }),
                Effect.sync(() => {
                    spy.mockRestore();
                })
            );
        }).pipe(Effect.provide(RealDrainerTestClockLayer))
    );

    it.effect('excludes consolidated hidden child transactions from findLiveIdsBySyncIds', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const transactionRepository = yield* TransactionRepository;
            const { fromAccount, toAccount } = yield* seed.accountPair('UA-VIS-FROM', 'UA-VIS-TO');
            const operatedAt = new Date('2026-06-12T08:00:00.000Z');
            const amount = convertToMicroUnits(250);
            const sourceExpense = yield* seedBankPair.expense(
                { externalId: 'visibility-expense', operatedAt },
                { accountId: fromAccount.id, amount, toIban: 'UA-VIS-TO' }
            );
            const sourceIncome = yield* seedBankPair.income(
                { externalId: 'visibility-income', operatedAt },
                { accountId: toAccount.id, amount }
            );

            expect(yield* transferConsolidationService.consolidate(null)).toEqual({ found: 1, consolidated: 1 });
            const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

            yield* assignSyncId(sourceExpense.id, 'sync-hidden-expense');
            yield* assignSyncId(sourceIncome.id, 'sync-hidden-income');
            yield* assignSyncId(canonical.id, 'sync-visible-canonical');

            expect((yield* testQueryService.findTransactionById(sourceExpense.id)).consolidationParentTransactionId).toBe(canonical.id);
            expect((yield* testQueryService.findTransactionById(sourceIncome.id)).consolidationParentTransactionId).toBe(canonical.id);

            const liveRows = yield* transactionRepository.findLiveIdsBySyncIds([
                'sync-hidden-expense',
                'sync-hidden-income',
                'sync-visible-canonical'
            ]);

            expect(liveRows).toStrictEqual([{ id: canonical.id, operatedAt: canonical.operatedAt }]);
        }).pipe(Effect.provide(TestLayer))
    );
});
