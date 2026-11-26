import { ConsolidationCandidateRepository, ConsolidationCoordinatorService } from '@budgie/consolidation';
import {
    AccountEntityTable,
    AccountTypeEnum,
    CategorySourceEnum,
    ExternalSourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionUpdatedByEnum,
    convertToMicroUnits
} from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/ledger';
import { expect, layer } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

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
    seedIbanBridgeIncomeLeg,
    seedIbanBridgeLegs,
    seedIbanBridgeSourceExpense,
    seedIbanBridgeTopology
} from '../harness/iban-bridge-topology';
import { seedManualExpenseDuplicateAccounts, seedManualExpenseDuplicatePairs } from '../harness/manual-expense-duplicate-fixture';
import {
    P2P_BANK_AMOUNT,
    P2P_OPERATED_AT,
    seedP2pAccount,
    seedP2pBankBuyExpense,
    seedP2pBuyIncome,
    seedP2pExchangeRate,
    seedP2pUsdt
} from '../harness/p2p-fiat-transfer-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { rebuildStoredBalances, testDb, testQueryService, testSeedService, TestLayer, unconsolidateById } from '../harness/test-context';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const ATM_WITHDRAWAL_AMOUNT = convertToMicroUnits(500);
const ATM_FIRST_FEE_AMOUNT = convertToMicroUnits(10);
const ATM_SECOND_FEE_AMOUNT = convertToMicroUnits(25);
const TRANSFER_AMOUNT = convertToMicroUnits(3_000);
const TRANSFER_FEE_AMOUNT = convertToMicroUnits(90);
const COFFEE_EXPENSE_AMOUNT = convertToMicroUnits(5);
const P2P_ASSET_AMOUNT = convertToMicroUnits(1_000);
const P2P_UNIT_PRICE = convertToMicroUnits(41);
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

            yield* testDb
                .delete(TransactionEntryEntityTable)
                .where(
                    and(
                        eq(TransactionEntryEntityTable.transactionId, canonicalId),
                        eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.FEE),
                        isNull(TransactionEntryEntityTable.originalTransactionId)
                    )
                );
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
});
