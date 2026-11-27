import { ConsolidationCandidateRepository, ConsolidationCoordinatorService } from '@budgie/consolidation';
import {
    AccountEntityTable,
    AccountTypeEnum,
    CategorySourceEnum,
    ExternalSourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionUpdatedByEnum,
    convertToMicroUnits
} from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/ledger';
import { expect, layer } from '@effect/vitest';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { CHAIN_RECLAIM_STALE_RATE_MULTIPLIER, seedNestedChainReclaimFixture } from '../harness/chain-reclaim-fixture';
import {
    expectConsolidationParent,
    fetchLedgerBalances,
    fetchOwnLedgerEntries,
    fetchSingleCanonicalId
} from '../harness/consolidation-revert-audit';
import {
    IBAN_BRIDGE_OPERATED_AT,
    IBAN_BRIDGE_SOURCE_IBAN,
    IBAN_BRIDGE_TARGET_IBAN,
    IBAN_BRIDGE_UAH_AMOUNT,
    IBAN_BRIDGE_UAH_TO_EUR_RATE,
    seedIbanBridgeDuplicatePairFixture,
    seedIbanBridgeIncomeLeg,
    seedIbanBridgeLegs,
    seedIbanBridgeSourceExpense,
    seedIbanBridgeTopology
} from '../harness/iban-bridge-topology';
import { seedManualExpenseDuplicateAccounts, seedManualExpenseDuplicatePairs } from '../harness/manual-expense-duplicate-fixture';
import {
    P2P_BANK_AMOUNT,
    P2P_OPERATED_AT,
    P2P_SPLIT_BANK_EXTRA_AMOUNT,
    P2P_SPLIT_BANK_PRIMARY_AMOUNT,
    seedP2pAccount,
    seedP2pBankBuyExpense,
    seedP2pBuyIncome,
    seedP2pExchangeRate,
    seedP2pUsdt
} from '../harness/p2p-fiat-transfer-fixture';
import { REJECTED_PAYMENT_PRINCIPAL_TITLE } from '../harness/rejected-payment-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { rebuildStoredBalances, testDb, testQueryService, testSeedService, TestLayer, unconsolidateById } from '../harness/test-context';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const MINUTE_MILLISECONDS = 60_000;
const ATM_WITHDRAWAL_AMOUNT = convertToMicroUnits(500);
const ATM_FIRST_FEE_AMOUNT = convertToMicroUnits(10);
const ATM_SECOND_FEE_AMOUNT = convertToMicroUnits(25);
const TRANSFER_AMOUNT = convertToMicroUnits(3_000);
const TRANSFER_FEE_AMOUNT = convertToMicroUnits(90);
const DUAL_REPAIR_FIRST_FEE_AMOUNT = convertToMicroUnits(100);
const DUAL_REPAIR_SECOND_FEE_AMOUNT = convertToMicroUnits(200);
const COFFEE_EXPENSE_AMOUNT = convertToMicroUnits(5);
const P2P_ASSET_AMOUNT = convertToMicroUnits(1_000);
const P2P_UNIT_PRICE = convertToMicroUnits(41);
const P2P_REJECTED_BANK_AMOUNT = convertToMicroUnits(1_000);
const P2P_REJECTED_USDT_AMOUNT = convertToMicroUnits(25);
const P2P_REJECTED_UAH_TO_USDT_RATE = 1 / 40;
const P2P_OUT_OF_SCOPE_OFFSET_DAYS = 20;
const P2P_SCOPE_PADDING_MS = 120_000;
const MANUAL_DUPLICATE_PAIR_INDEXES = [0, 1, 2] as const;

const fetchLiveFeeAmounts = (transactionId: number) =>
    Effect.map(fetchOwnLedgerEntries(transactionId), entries =>
        entries
            .filter(entry => entry.type === TransactionEntryTypeEnum.FEE)
            .map(entry => entry.amount)
            .sort((left, right) => left - right)
    );

const deleteLiveFeeEntries = (canonicalId: number, amount?: number) =>
    testDb
        .delete(TransactionEntryEntityTable)
        .where(
            and(
                eq(TransactionEntryEntityTable.transactionId, canonicalId),
                eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.FEE),
                isNull(TransactionEntryEntityTable.originalTransactionId),
                ...(isDefined(amount) ? [eq(TransactionEntryEntityTable.amount, amount)] : [])
            )
        );

layer(TestLayer)('consolidation/consolidation-safety-regressions', it => {
    it.effect('treats unconsolidating a nested child canonical as a no-op without triggering FK double-counting', () =>
        Effect.gen(function* () {
            const { bridgeAccount, directTransfer, sourceAccount, sourceExpense, targetAccount, targetIncome } =
                yield* seedNestedChainReclaimFixture({
                    directExchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE * CHAIN_RECLAIM_STALE_RATE_MULTIPLIER,
                    directToIban: IBAN_BRIDGE_SOURCE_IBAN
                });
            const accountIds = [sourceAccount.id, bridgeAccount.id, targetAccount.id];

            yield* runConsolidation();

            const outerCanonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);
            const balancesBeforeAttempt = yield* fetchLedgerBalances(accountIds);
            const outerChildrenBeforeAttempt = (yield* testQueryService.fetchChildTransactionIds(outerCanonicalId)).sort(
                (left, right) => left - right
            );

            yield* expectConsolidationParent(directTransfer.id, outerCanonicalId);
            yield* unconsolidateById(directTransfer.id);

            const nestedChildAfter = yield* testQueryService.fetchTransactionById(directTransfer.id);
            const outerCanonicalAfter = yield* testQueryService.fetchTransactionById(outerCanonicalId);

            expect(nestedChildAfter.consolidationParentTransactionId).toBe(outerCanonicalId);
            expect(nestedChildAfter.consolidationType).toBe(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(outerCanonicalAfter.consolidationParentTransactionId).toBeNull();
            expect(outerCanonicalAfter.deletedAt).toBeNull();
            expect((yield* testQueryService.fetchChildTransactionIds(outerCanonicalId)).sort((left, right) => left - right)).toEqual(
                outerChildrenBeforeAttempt
            );
            yield* expectConsolidationParent(sourceExpense.id, directTransfer.id);
            yield* expectConsolidationParent(targetIncome.id, directTransfer.id);
            expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBeforeAttempt);
        })
    );

    it.effect('preserves both live fee entries and exact ledger balances for ATM cash withdrawal', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const bankAccount = yield* testSeedService.account({ title: 'Multi-fee ATM Bank', type: AccountTypeEnum.BANK_SYNC });
            const cashAccount = yield* testSeedService.account({ title: 'Multi-fee ATM Cash', type: AccountTypeEnum.CASH });
            const atmMcc = yield* testQueryService.findMccByCode('6011');
            const withdrawal = yield* testSeedService.bankPairExpense(
                { externalId: 'atm-dual-fee-withdrawal', operatedAt: new Date(Date.now() - DAY_MILLISECONDS) },
                { accountId: bankAccount.id, amount: ATM_WITHDRAWAL_AMOUNT, mccCategoryId: atmMcc.id }
            );

            yield* testSeedService.feeEntry(withdrawal.id, 'atm-dual-fee-one', {
                accountId: bankAccount.id,
                amount: ATM_FIRST_FEE_AMOUNT
            });
            yield* testSeedService.feeEntry(withdrawal.id, 'atm-dual-fee-two', {
                accountId: bankAccount.id,
                amount: ATM_SECOND_FEE_AMOUNT
            });

            expect(yield* transferConsolidationService.moveAtmCashWithdrawalsToCash([withdrawal.id])).toBe(1);

            const canonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);

            expect(yield* fetchLiveFeeAmounts(canonicalId)).toEqual([ATM_FIRST_FEE_AMOUNT, ATM_SECOND_FEE_AMOUNT]);
            expect(yield* fetchLedgerBalances([bankAccount.id, cashAccount.id])).toEqual([
                [bankAccount.id, -(ATM_WITHDRAWAL_AMOUNT + ATM_FIRST_FEE_AMOUNT + ATM_SECOND_FEE_AMOUNT)],
                [cashAccount.id, ATM_WITHDRAWAL_AMOUNT]
            ]);
        })
    );

    it.effect('does not resurrect a removed fee on a user-edited consolidated transfer', () =>
        Effect.gen(function* () {
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const { expense, fromAccount } = yield* testSeedService.amountTransferPair(TRANSFER_AMOUNT, transferMcc.id);

            yield* testSeedService.feeEntry(expense.id, 'user-edited-transfer-fee', {
                accountId: fromAccount.id,
                amount: TRANSFER_FEE_AMOUNT
            });
            yield* runConsolidation();

            const canonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

            yield* deleteLiveFeeEntries(canonicalId);
            yield* testDb
                .update(TransactionEntityTable)
                .set({ updatedBy: TransactionUpdatedByEnum.USER })
                .where(eq(TransactionEntityTable.id, canonicalId));
            yield* rebuildStoredBalances;

            expect(yield* consolidationCoordinatorService.countMissingTransferFeeRepairCandidates()).toBe(0);
            expect(yield* consolidationCoordinatorService.repairMissingTransferFees()).toBe(0);
            expect(yield* runConsolidation()).toEqual({ found: 0, consolidated: 0 });
            expect(yield* fetchLiveFeeAmounts(canonicalId)).toEqual([]);
        })
    );

    it.effect('does not let EXISTING_TRANSFER_BRIDGE hijack an unrelated foreign-currency coffee expense within 60 seconds', () =>
        Effect.gen(function* () {
            const consolidationCandidateRepository = yield* ConsolidationCandidateRepository;
            const { bridgeAccount, sourceAccount, targetAccount, transferMccId } = yield* seedIbanBridgeTopology;
            const coffeeMcc = yield* testQueryService.findMccByCode('5814');
            const bridgeIncome = yield* seedIbanBridgeIncomeLeg(bridgeAccount.id, transferMccId);
            const existingTransfer = yield* testSeedService.directTransfer({
                consolidationType: null,
                exchangeRate: 1,
                operatedAt: IBAN_BRIDGE_OPERATED_AT,
                sourceAccountId: bridgeAccount.id,
                sourceAmount: IBAN_BRIDGE_UAH_AMOUNT,
                sourceEntryExchangeRate: 1,
                targetAccountId: targetAccount.id,
                targetAmount: IBAN_BRIDGE_UAH_AMOUNT,
                toIban: IBAN_BRIDGE_TARGET_IBAN
            });
            const coffeeExpense = yield* testSeedService.bankPairExpense(
                { externalId: 'unrelated-coffee-eur', operatedAt: new Date(IBAN_BRIDGE_OPERATED_AT.getTime() + 20_000) },
                { accountId: sourceAccount.id, amount: COFFEE_EXPENSE_AMOUNT, mccCategoryId: coffeeMcc.id }
            );

            expect(yield* consolidationCandidateRepository.findExistingTransferBridgeCandidates(null)).toEqual([]);
            expect(yield* runConsolidation()).toEqual({ found: 0, consolidated: 0 });
            expect((yield* testQueryService.fetchTransactionById(coffeeExpense.id)).consolidationParentTransactionId).toBeNull();
            expect((yield* testQueryService.fetchTransactionById(bridgeIncome.id)).consolidationParentTransactionId).toBeNull();
            expect((yield* testQueryService.fetchTransactionById(existingTransfer.id)).consolidationParentTransactionId).toBeNull();
        })
    );

    it.effect('does not match an empty to_iban CREDIT expense when the bridge account iban is empty', () =>
        Effect.gen(function* () {
            const consolidationCandidateRepository = yield* ConsolidationCandidateRepository;
            const { bridgeAccount, sourceAccount, transferMccId } = yield* seedIbanBridgeTopology;

            yield* testDb.update(AccountEntityTable).set({ iban: '' }).where(eq(AccountEntityTable.id, bridgeAccount.id));
            yield* seedIbanBridgeLegs(bridgeAccount.id, transferMccId);

            expect((yield* runConsolidation()).consolidated).toBe(1);

            const emptyIbanExpense = yield* seedIbanBridgeSourceExpense(sourceAccount.id, transferMccId, '');

            yield* rebuildStoredBalances;

            expect(yield* consolidationCandidateRepository.findIbanBridgeEndLegCandidates(null)).toEqual([]);
            expect(yield* runConsolidation()).toEqual({ found: 0, consolidated: 0 });
            expect((yield* testQueryService.fetchTransactionById(emptyIbanExpense.id)).consolidationParentTransactionId).toBeNull();
        })
    );

    it.effect('preserves MCC_DEFAULT categorySource when MANUAL_EXPENSE_DUPLICATE merges an uncategorized manual expense', () =>
        Effect.gen(function* () {
            const accounts = yield* seedManualExpenseDuplicateAccounts();
            const diningCategory = yield* testSeedService.category('Dining');
            const pairs = yield* seedManualExpenseDuplicatePairs(accounts, MANUAL_DUPLICATE_PAIR_INDEXES);
            const [firstPair] = pairs;
            const [firstSyncedEntry] = yield* fetchOwnLedgerEntries(firstPair.synced.id);

            yield* testSeedService.entryCategory(firstSyncedEntry.id, diningCategory.id, CategorySourceEnum.MCC_DEFAULT);

            expect(yield* runConsolidation()).toEqual({ found: 3, consolidated: 3 });
            expect((yield* testQueryService.fetchTransactionById(firstPair.synced.id)).consolidationType).toBe(
                TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE
            );
            yield* expectConsolidationParent(firstPair.manual.id, firstPair.synced.id);

            const [syncedEntryAfterMerge] = yield* fetchOwnLedgerEntries(firstPair.synced.id);

            expect(syncedEntryAfterMerge.categoryId).toBe(diningCategory.id);
            expect(syncedEntryAfterMerge.categorySource).toBe(CategorySourceEnum.MCC_DEFAULT);
        })
    );

    it.effect('consolidates an in-scope atomic P2P pair even when an out-of-scope authoritative P2P pair exists', () =>
        Effect.gen(function* () {
            const consolidationCandidateRepository = yield* ConsolidationCandidateRepository;
            const bankAccount = yield* testSeedService.bankSyncAccount('Scoped P2P Bank', ExternalSourceEnum.MONOBANK, null);
            const usdt = yield* seedP2pUsdt;
            const binanceAccount = yield* seedP2pAccount(AccountTypeEnum.CRYPTO_SYNC, usdt.id);
            const outOfScopeOperatedAt = new Date(P2P_OPERATED_AT.getTime() - P2P_OUT_OF_SCOPE_OFFSET_DAYS * DAY_MILLISECONDS);

            yield* seedP2pExchangeRate(bankAccount.instrumentId, usdt.id, 1 / 41);

            const outOfScopeBankExpense = yield* testSeedService.bankPairExpense(
                { externalId: 'p2p-out-of-scope-bank', operatedAt: outOfScopeOperatedAt },
                { accountId: bankAccount.id, amount: P2P_BANK_AMOUNT }
            );
            const outOfScopeP2pIncome = yield* testSeedService.bankPairIncome(
                { externalId: 'binance:c2c:out-of-scope', operatedAt: new Date(outOfScopeOperatedAt.getTime() + 30_000) },
                { accountId: binanceAccount.id, amount: P2P_ASSET_AMOUNT }
            );

            yield* testSeedService.updateTransaction(outOfScopeP2pIncome.id, {
                externalSource: ExternalSourceEnum.BINANCE,
                title: 'Binance P2P buy USDT'
            });
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({
                    quotedInstrumentId: bankAccount.instrumentId,
                    quotedAmount: P2P_BANK_AMOUNT,
                    quotedUnitPrice: P2P_UNIT_PRICE
                })
                .where(eq(TransactionEntryEntityTable.transactionId, outOfScopeP2pIncome.id));

            const inScopeBankExpense = yield* seedP2pBankBuyExpense(bankAccount.id);
            const inScopeP2pIncome = yield* seedP2pBuyIncome(binanceAccount.id, null);

            expect(yield* consolidationCandidateRepository.findP2pFiatAuthoritativeCandidates(null)).toHaveLength(1);

            const scopedResult = yield* runConsolidation({
                operatedAtFrom: new Date(P2P_OPERATED_AT.getTime() - P2P_SCOPE_PADDING_MS),
                operatedAtTo: new Date(P2P_OPERATED_AT.getTime() + P2P_SCOPE_PADDING_MS),
                transactionIds: [inScopeBankExpense.id, inScopeP2pIncome.id]
            });

            expect(scopedResult.consolidated).toBe(1);

            const canonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER);

            yield* expectConsolidationParent(inScopeBankExpense.id, canonicalId);
            yield* expectConsolidationParent(inScopeP2pIncome.id, canonicalId);
            expect((yield* testQueryService.fetchTransactionById(outOfScopeBankExpense.id)).consolidationParentTransactionId).toBeNull();
            expect((yield* testQueryService.fetchTransactionById(outOfScopeP2pIncome.id)).consolidationParentTransactionId).toBeNull();
        })
    );

    it.effect('rolls back duplicate-pair unconsolidation when end-leg claim fails inside the chunked coordinator', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const transactionEntryRepository = yield* TransactionEntryRepository;
            const { accountIds, duplicatePair, sourceExpense, targetIncome } = yield* seedIbanBridgeDuplicatePairFixture();

            yield* rebuildStoredBalances;

            const balancesBeforeConsolidation = yield* fetchLedgerBalances(accountIds);
            const eligibilitySpy = vi.spyOn(transactionEntryRepository, 'hasMovedSourceEntries').mockReturnValueOnce(Effect.succeed(true));

            yield* Effect.ensuring(
                Effect.gen(function* () {
                    yield* transferConsolidationService.consolidate(null);

                    expect(eligibilitySpy).toHaveBeenCalledTimes(1);
                }),
                Effect.sync(() => {
                    eligibilitySpy.mockRestore();
                })
            );

            expect(yield* testQueryService.findTransactionById(duplicatePair.id)).toMatchObject({
                consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
                deletedAt: null
            });
            yield* expectConsolidationParent(sourceExpense.id, duplicatePair.id);
            yield* expectConsolidationParent(targetIncome.id, duplicatePair.id);
            expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBeforeConsolidation);
        })
    );

    it.effect('repairs both missing transfer fees and restores a single missing fee without duplicating the remaining one', () =>
        Effect.gen(function* () {
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const { expense, fromAccount, toAccount } = yield* testSeedService.amountTransferPair(TRANSFER_AMOUNT, transferMcc.id);

            yield* testSeedService.feeEntry(expense.id, 'dual-repair-fee-one', {
                accountId: fromAccount.id,
                amount: DUAL_REPAIR_FIRST_FEE_AMOUNT
            });
            yield* testSeedService.feeEntry(expense.id, 'dual-repair-fee-two', {
                accountId: fromAccount.id,
                amount: DUAL_REPAIR_SECOND_FEE_AMOUNT
            });

            const accountIds = [fromAccount.id, toAccount.id];
            const balancesBeforeConsolidation = yield* fetchLedgerBalances(accountIds);

            yield* runConsolidation();

            const canonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

            for (const deletionAmount of [undefined, DUAL_REPAIR_SECOND_FEE_AMOUNT]) {
                yield* deleteLiveFeeEntries(canonicalId, deletionAmount);

                expect(yield* consolidationCoordinatorService.repairMissingTransferFees()).toBe(1);
                expect(yield* fetchLiveFeeAmounts(canonicalId)).toEqual([DUAL_REPAIR_FIRST_FEE_AMOUNT, DUAL_REPAIR_SECOND_FEE_AMOUNT]);
                expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBeforeConsolidation);
                expect(yield* consolidationCoordinatorService.repairMissingTransferFees()).toBe(0);
            }

            yield* rebuildStoredBalances;
        })
    );

    it.effect('repairs and re-consolidates a mispaired P2P canonical in one pass when no visible expenses or incomes exist', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const bankAccount = yield* testSeedService.bankSyncAccount('P2P Single-Pass Repair Bank', ExternalSourceEnum.MONOBANK, null);
            const usdt = yield* seedP2pUsdt;
            const binanceAccount = yield* seedP2pAccount(AccountTypeEnum.CRYPTO_SYNC, usdt.id);

            yield* seedP2pExchangeRate(bankAccount.instrumentId, usdt.id, 1 / 41);

            const matchingBankExpense = yield* testSeedService.bankPairExpense(
                { externalId: 'p2p-single-pass-matching-bank', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: P2P_SPLIT_BANK_PRIMARY_AMOUNT }
            );
            const extraBankExpense = yield* testSeedService.bankPairExpense(
                { externalId: 'p2p-single-pass-extra-bank', operatedAt: new Date(P2P_OPERATED_AT.getTime() + 10_000) },
                { accountId: bankAccount.id, amount: P2P_SPLIT_BANK_EXTRA_AMOUNT }
            );
            const p2pIncome = yield* seedP2pBuyIncome(binanceAccount.id, null);

            expect((yield* runConsolidation()).consolidated).toBe(1);

            const initialCanonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER);
            const visibleLegRows = yield* testDb
                .select({ id: TransactionEntityTable.id })
                .from(TransactionEntityTable)
                .where(
                    and(
                        isNull(TransactionEntityTable.deletedAt),
                        isNull(TransactionEntityTable.consolidationParentTransactionId),
                        inArray(TransactionEntityTable.type, [TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME])
                    )
                );

            expect(visibleLegRows).toStrictEqual([]);

            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({
                    quotedInstrumentId: bankAccount.instrumentId,
                    quotedAmount: P2P_SPLIT_BANK_PRIMARY_AMOUNT,
                    quotedUnitPrice: convertToMicroUnits(20)
                })
                .where(eq(TransactionEntryEntityTable.originalTransactionId, p2pIncome.id));

            yield* transferConsolidationService.consolidate(null);

            const repairedCanonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER);

            expect(repairedCanonicalId).not.toBe(initialCanonicalId);
            yield* expectConsolidationParent(matchingBankExpense.id, repairedCanonicalId);
            yield* expectConsolidationParent(p2pIncome.id, repairedCanonicalId);
            expect((yield* testQueryService.fetchTransactionById(extraBankExpense.id)).consolidationParentTransactionId).toBeNull();
        })
    );

    it.effect('excludes a rejected-payment bank expense from atomic P2P matching so the retry leg pairs with Binance', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const bankAccount = yield* testSeedService.bankSyncAccount('P2P Rejected Retry Bank', ExternalSourceEnum.PRIVATBANK, null);
            const usdt = yield* seedP2pUsdt;
            const binanceAccount = yield* seedP2pAccount(AccountTypeEnum.CRYPTO_SYNC, usdt.id);

            yield* seedP2pExchangeRate(bankAccount.instrumentId, usdt.id, P2P_REJECTED_UAH_TO_USDT_RATE);

            const rejectedBankExpense = yield* testSeedService.bankPairExpense(
                { externalId: 'p2p-rejected-bank-expense', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: P2P_REJECTED_BANK_AMOUNT }
            );
            const rejectedRefundIncome = yield* testSeedService.bankPairIncome(
                {
                    externalId: 'p2p-rejected-bank-refund',
                    operatedAt: new Date(P2P_OPERATED_AT.getTime() + 5 * MINUTE_MILLISECONDS)
                },
                { accountId: bankAccount.id, amount: P2P_REJECTED_BANK_AMOUNT }
            );
            const retryBankExpense = yield* testSeedService.bankPairExpense(
                {
                    externalId: 'p2p-retry-bank-expense',
                    operatedAt: new Date(P2P_OPERATED_AT.getTime() + 10 * MINUTE_MILLISECONDS)
                },
                { accountId: bankAccount.id, amount: P2P_REJECTED_BANK_AMOUNT }
            );
            const p2pBuyIncome = yield* testSeedService.bankPairIncome(
                {
                    externalId: 'binance:c2c:rejected-retry-order',
                    operatedAt: new Date(P2P_OPERATED_AT.getTime() + MINUTE_MILLISECONDS)
                },
                { accountId: binanceAccount.id, amount: P2P_REJECTED_USDT_AMOUNT }
            );

            yield* testSeedService.updateTransaction(rejectedBankExpense.id, {
                externalSource: ExternalSourceEnum.PRIVATBANK
            });
            yield* testSeedService.updateTransaction(rejectedRefundIncome.id, {
                externalSource: ExternalSourceEnum.PRIVATBANK,
                title: REJECTED_PAYMENT_PRINCIPAL_TITLE
            });
            yield* testSeedService.updateTransaction(retryBankExpense.id, {
                externalSource: ExternalSourceEnum.PRIVATBANK
            });
            yield* testSeedService.updateTransaction(p2pBuyIncome.id, {
                externalSource: ExternalSourceEnum.BINANCE,
                title: 'Binance P2P buy USDT'
            });

            yield* transferConsolidationService.consolidate(null);

            const p2pCanonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER);

            yield* expectConsolidationParent(retryBankExpense.id, p2pCanonicalId);
            yield* expectConsolidationParent(p2pBuyIncome.id, p2pCanonicalId);
            yield* expectConsolidationParent(rejectedRefundIncome.id, rejectedBankExpense.id);
            expect((yield* testQueryService.fetchTransactionById(rejectedBankExpense.id)).consolidationType).toBe(
                TransactionConsolidationTypeEnum.REFUND
            );
        })
    );
});
