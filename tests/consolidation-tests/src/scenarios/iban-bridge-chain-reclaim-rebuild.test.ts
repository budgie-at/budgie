import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    CHAIN_RECLAIM_STALE_RATE_MULTIPLIER,
    seedChainReclaimFixture,
    seedNestedChainReclaimFixture
} from '../harness/chain-reclaim-fixture';
import {
    expectConsolidationParent,
    expectSourcesRestored,
    fetchLedgerBalances,
    fetchLedgerEntry,
    fetchOwnLedgerEntries,
    fetchSingleCanonicalId
} from '../harness/consolidation-revert-audit';
import {
    IBAN_BRIDGE_EUR_AMOUNT,
    IBAN_BRIDGE_SOURCE_IBAN,
    IBAN_BRIDGE_TARGET_IBAN,
    IBAN_BRIDGE_UAH_AMOUNT,
    IBAN_BRIDGE_UAH_TO_EUR_RATE
} from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, unconsolidateById, TestLayer } from '../harness/test-context';

const RATE_PRECISION_DIGITS = 10;
const REBUILT_LEDGER_ENTRY_COUNT = 2;
const STALE_DIRECT_TRANSFER = {
    directExchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE * CHAIN_RECLAIM_STALE_RATE_MULTIPLIER,
    directToIban: IBAN_BRIDGE_SOURCE_IBAN
};

const fetchRebuiltCanonicalId = () =>
    Effect.gen(function* () {
        return yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);
    });

const expectRebuiltCanonicalLedger = (canonicalId: number, sourceAccountId: number, targetAccountId: number) =>
    Effect.gen(function* () {
        const sourceLedgerEntry = yield* fetchLedgerEntry(canonicalId, sourceAccountId);

        expect((yield* testQueryService.fetchTransactionById(canonicalId)).exchangeRate).toBeCloseTo(
            IBAN_BRIDGE_UAH_TO_EUR_RATE,
            RATE_PRECISION_DIGITS
        );
        expect(sourceLedgerEntry.amount).toBe(IBAN_BRIDGE_EUR_AMOUNT);
        expect(sourceLedgerEntry.toIban).toBe(IBAN_BRIDGE_TARGET_IBAN);
        expect(sourceLedgerEntry.exchangeRate).toBeCloseTo(IBAN_BRIDGE_UAH_TO_EUR_RATE, RATE_PRECISION_DIGITS);
        expect((yield* fetchLedgerEntry(canonicalId, targetAccountId)).amount).toBe(IBAN_BRIDGE_UAH_AMOUNT);
    });

layer(TestLayer)('consolidation/iban-bridge-chain-reclaim-rebuild', it => {
    it.effect('rebuilds an fx-correct canonical when the existing transfer ledger diverges', () =>
        Effect.gen(function* () {
            const { bridgeExpense, bridgeIncome, directTransfer, sourceAccount, targetAccount } = yield* seedChainReclaimFixture({
                consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
                ...STALE_DIRECT_TRANSFER
            });

            const result = yield* runConsolidation();
            const rebuiltCanonicalId = yield* fetchRebuiltCanonicalId();

            expect(result.found).toBe(1);
            expect(result.consolidated).toBe(1);
            expect(rebuiltCanonicalId).not.toBe(directTransfer.id);
            yield* expectConsolidationParent(directTransfer.id, rebuiltCanonicalId);
            yield* expectConsolidationParent(bridgeIncome.id, rebuiltCanonicalId);
            yield* expectConsolidationParent(bridgeExpense.id, rebuiltCanonicalId);
            yield* expectRebuiltCanonicalLedger(rebuiltCanonicalId, sourceAccount.id, targetAccount.id);
        })
    );

    it.effect('restores the original transfer pair when a rebuilt chain canonical is reverted', () =>
        Effect.gen(function* () {
            const { bridgeExpense, bridgeIncome, directTransfer } = yield* seedChainReclaimFixture({
                consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
                ...STALE_DIRECT_TRANSFER
            });

            yield* runConsolidation();
            yield* unconsolidateById(yield* fetchRebuiltCanonicalId());

            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER)).toHaveLength(
                0
            );
            expect((yield* testQueryService.fetchTransactionById(directTransfer.id)).consolidationType).toBe(
                TransactionConsolidationTypeEnum.TRANSFER_PAIR
            );
            yield* expectSourcesRestored([directTransfer.id, bridgeIncome.id, bridgeExpense.id]);
            expect(yield* fetchOwnLedgerEntries(directTransfer.id)).toHaveLength(REBUILT_LEDGER_ENTRY_COUNT);
        })
    );

    it.effect('unwinds both consolidation levels and deletes the absorbed transfer pair when a fast-path reclaim is reverted', () =>
        Effect.gen(function* () {
            const {
                bridgeAccount,
                bridgeExpense,
                bridgeIncome,
                directTransfer,
                sourceAccount,
                sourceExpense,
                targetAccount,
                targetIncome
            } = yield* seedNestedChainReclaimFixture();
            const accountIds = [sourceAccount.id, bridgeAccount.id, targetAccount.id];
            const balancesBeforeConsolidation = yield* fetchLedgerBalances(accountIds);

            yield* runConsolidation();
            yield* unconsolidateById(directTransfer.id);

            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER)).toHaveLength(
                0
            );
            expect(yield* testQueryService.findTransactionById(directTransfer.id)).toBeUndefined();
            yield* expectSourcesRestored([sourceExpense.id, targetIncome.id, bridgeIncome.id, bridgeExpense.id]);
            expect(yield* fetchOwnLedgerEntries(sourceExpense.id)).toHaveLength(1);
            expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBeforeConsolidation);
        })
    );
});
