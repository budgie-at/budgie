import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

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
import { consolidationCoordinatorService, testQueryService, testSeedService } from '../harness/test-context';

const repair = async (): Promise<number> => consolidationCoordinatorService.repairBridgeClaimedTransferPairs();

const seedStolenPairFixture = async (): Promise<{
    readonly bridgeUahAccountId: number;
    readonly canonicalId: number;
    readonly fxBridgeIncomeId: number;
    readonly fxExpenseId: number;
    readonly interbankExpenseAccountId: number;
    readonly interbankExpenseId: number;
    readonly sourceEurAccountId: number;
}> => {
    const fixture = seedBridgeTheftFixture();

    const canonical = testSeedService.directTransfer({
        consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
        exchangeRate: 1,
        operatedAt: new Date(BRIDGE_THEFT_FX_OPERATED_AT.getTime() + 131_000),
        sourceAccountId: fixture.interbankExpenseAccountId,
        sourceAmount: BRIDGE_THEFT_FX_UAH_AMOUNT,
        sourceEntryExchangeRate: 1,
        targetAccountId: fixture.bridgeUahAccountId,
        targetAmount: BRIDGE_THEFT_FX_UAH_AMOUNT,
        title: BRIDGE_THEFT_INTERBANK_EXPENSE_TITLE,
        toIban: null
    });
    await parentConsolidationSource(fixture.interbankExpense.id, canonical.id);
    await parentConsolidationSource(fixture.fxBridgeIncome.id, canonical.id);

    return {
        bridgeUahAccountId: fixture.bridgeUahAccountId,
        canonicalId: canonical.id,
        fxBridgeIncomeId: fixture.fxBridgeIncome.id,
        fxExpenseId: fixture.fxExpense.id,
        interbankExpenseAccountId: fixture.interbankExpenseAccountId,
        interbankExpenseId: fixture.interbankExpense.id,
        sourceEurAccountId: fixture.sourceEurAccountId
    };
};

describe('consolidation/bridge-claim-repair', () => {
    it('unpairs a stolen bridge income, rebuilds the fx transfer and restores the interbank expense', async () => {
        const fixture = await seedStolenPairFixture();

        const repairedCount = await repair();

        expect(repairedCount).toBe(1);
        expect(testQueryService.findTransactionById(fixture.canonicalId)).toBeUndefined();
        const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonicals).toHaveLength(1);
        const rebuilt = canonicals[0];
        expectFxPairCanonicalChildren(rebuilt.id, {
            fxExpenseId: fixture.fxExpenseId,
            fxBridgeIncomeId: fixture.fxBridgeIncomeId,
            interbankExpenseId: fixture.interbankExpenseId
        });
        expect(
            await fetchLedgerBalances([fixture.sourceEurAccountId, fixture.bridgeUahAccountId, fixture.interbankExpenseAccountId])
        ).toEqual([
            [fixture.sourceEurAccountId, -BRIDGE_THEFT_FX_EUR_AMOUNT],
            [fixture.bridgeUahAccountId, BRIDGE_THEFT_FX_UAH_AMOUNT],
            [fixture.interbankExpenseAccountId, -BRIDGE_THEFT_FX_UAH_AMOUNT]
        ]);
    });

    it('is stable when the repair runs twice', async () => {
        await seedStolenPairFixture();

        await repair();
        const repairedCount = await repair();

        expect(repairedCount).toBe(0);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
    });
});
