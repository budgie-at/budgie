import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    BRIDGE_THEFT_FX_EUR_AMOUNT,
    BRIDGE_THEFT_FX_OPERATED_AT,
    BRIDGE_THEFT_FX_UAH_AMOUNT,
    BRIDGE_THEFT_INTERBANK_EXPENSE_TITLE,
    expectFxPairCanonicalChildren,
    seedBridgeTheftFixture
} from '../harness/bridge-theft-fixture';
import { fetchLedgerBalances } from '../harness/consolidation-revert-audit';
import { parentConsolidationSource } from '../harness/iban-bridge-topology';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const repair = Effect.flatMap(ConsolidationCoordinatorService, consolidationCoordinatorService =>
    consolidationCoordinatorService.repairBridgeClaimedTransferPairs()
);

const seedCanonicalPair = (params: {
    readonly sourceAccountId: number;
    readonly sourceAmount: number;
    readonly targetAccountId: number;
    readonly targetAmount: number;
    readonly title: string;
    readonly firstSourceId: number;
    readonly secondSourceId: number;
}) =>
    Effect.gen(function* () {
        const canonical = yield* testSeedService.directTransfer({
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            exchangeRate: 1,
            operatedAt: new Date(BRIDGE_THEFT_FX_OPERATED_AT.getTime() + 131_000),
            sourceAccountId: params.sourceAccountId,
            sourceAmount: params.sourceAmount,
            sourceEntryExchangeRate: 1,
            targetAccountId: params.targetAccountId,
            targetAmount: params.targetAmount,
            title: params.title,
            toIban: null
        });
        yield* parentConsolidationSource(params.firstSourceId, canonical.id);
        yield* parentConsolidationSource(params.secondSourceId, canonical.id);

        return canonical.id;
    });

const seedStolenPairFixture = () =>
    Effect.gen(function* () {
        const fixture = yield* seedBridgeTheftFixture();
        const canonicalId = yield* seedCanonicalPair({
            firstSourceId: fixture.interbankExpense.id,
            secondSourceId: fixture.fxBridgeIncome.id,
            sourceAccountId: fixture.interbankExpenseAccountId,
            sourceAmount: BRIDGE_THEFT_FX_UAH_AMOUNT,
            targetAccountId: fixture.bridgeUahAccountId,
            targetAmount: BRIDGE_THEFT_FX_UAH_AMOUNT,
            title: BRIDGE_THEFT_INTERBANK_EXPENSE_TITLE
        });

        return {
            bridgeUahAccountId: fixture.bridgeUahAccountId,
            canonicalId,
            fxBridgeIncomeId: fixture.fxBridgeIncome.id,
            fxExpenseId: fixture.fxExpense.id,
            interbankExpenseAccountId: fixture.interbankExpenseAccountId,
            interbankExpenseId: fixture.interbankExpense.id,
            sourceEurAccountId: fixture.sourceEurAccountId
        };
    });

layer(TestLayer)('consolidation/bridge-claim-repair', it => {
    it.effect('unpairs a stolen bridge income, rebuilds the fx transfer and restores the interbank expense', () =>
        Effect.gen(function* () {
            const fixture = yield* seedStolenPairFixture();

            const repairedCount = yield* repair;

            expect(repairedCount).toBe(1);
            expect(yield* testQueryService.findTransactionById(fixture.canonicalId)).toBeUndefined();
            const canonicals = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(canonicals).toHaveLength(1);
            const rebuilt = canonicals[0];
            yield* expectFxPairCanonicalChildren(rebuilt.id, {
                fxExpenseId: fixture.fxExpenseId,
                fxBridgeIncomeId: fixture.fxBridgeIncomeId,
                interbankExpenseId: fixture.interbankExpenseId
            });
            expect(
                yield* fetchLedgerBalances([fixture.sourceEurAccountId, fixture.bridgeUahAccountId, fixture.interbankExpenseAccountId])
            ).toEqual([
                [fixture.sourceEurAccountId, -BRIDGE_THEFT_FX_EUR_AMOUNT],
                [fixture.bridgeUahAccountId, BRIDGE_THEFT_FX_UAH_AMOUNT],
                [fixture.interbankExpenseAccountId, -BRIDGE_THEFT_FX_UAH_AMOUNT]
            ]);
        })
    );

    it.effect('is stable when the repair runs twice', () =>
        Effect.gen(function* () {
            yield* seedStolenPairFixture();

            yield* repair;
            const repairedCount = yield* repair;

            expect(repairedCount).toBe(0);
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
        })
    );

    it.effect('does not unpair a legitimate fx bridge pair whose source expense is already consolidated', () =>
        Effect.gen(function* () {
            const fixture = yield* seedBridgeTheftFixture();
            const canonicalId = yield* seedCanonicalPair({
                firstSourceId: fixture.fxExpense.id,
                secondSourceId: fixture.fxBridgeIncome.id,
                sourceAccountId: fixture.sourceEurAccountId,
                sourceAmount: BRIDGE_THEFT_FX_EUR_AMOUNT,
                targetAccountId: fixture.bridgeUahAccountId,
                targetAmount: BRIDGE_THEFT_FX_UAH_AMOUNT,
                title: BRIDGE_THEFT_INTERBANK_EXPENSE_TITLE
            });

            const repairedCount = yield* repair;

            expect(repairedCount).toBe(0);
            expect(yield* testQueryService.findTransactionById(canonicalId)).toBeDefined();
            expect((yield* testQueryService.findTransactionById(fixture.fxBridgeIncome.id))?.consolidationParentTransactionId).toBe(
                canonicalId
            );
        })
    );
});
