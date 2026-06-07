import { PRECISION, TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { expect } from 'vitest';

import { runConsolidation } from './run-consolidation';
import { testQueryService, testSeedService } from './test-context';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';
import type { ChainReclaimScenarioInputInterface } from '@budgie-at/test-kit';

const CHAIN_RECLAIM_TARGET_UAH_UNITS = 4000;
const CHAIN_RECLAIM_OPERATED_AT_YEAR = 2026;

export const CHAIN_RECLAIM_SOURCE_AMOUNT = 100 * PRECISION;
export const CHAIN_RECLAIM_TARGET_AMOUNT = CHAIN_RECLAIM_TARGET_UAH_UNITS * PRECISION;
export const CHAIN_RECLAIM_BRIDGE_EXCHANGE_RATE = 40;
export const CHAIN_RECLAIM_EXCHANGE_RATE = CHAIN_RECLAIM_SOURCE_AMOUNT / CHAIN_RECLAIM_TARGET_AMOUNT;
export const CHAIN_RECLAIM_OPERATED_AT = new Date(CHAIN_RECLAIM_OPERATED_AT_YEAR, 0, 15, 12, 0, 0);

type ChainReclaimFixtureOverrides = Omit<
    ChainReclaimScenarioInputInterface,
    'sourceAmount' | 'targetAmount' | 'bridgeExchangeRate' | 'operatedAt'
>;

export const seedChainReclaim = (overrides: ChainReclaimFixtureOverrides = {}) =>
    testSeedService.chainReclaimScenario({
        sourceAmount: CHAIN_RECLAIM_SOURCE_AMOUNT,
        targetAmount: CHAIN_RECLAIM_TARGET_AMOUNT,
        bridgeExchangeRate: CHAIN_RECLAIM_BRIDGE_EXCHANGE_RATE,
        operatedAt: CHAIN_RECLAIM_OPERATED_AT,
        ...overrides
    });

export const runChainReclaimAndExpectSingleCanonical = async (): Promise<TransactionEntityInterface> => {
    const result = await runConsolidation();
    expect(result.consolidated).toBe(1);

    const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);
    expect(canonicals).toHaveLength(1);

    return canonicals[0];
};

export const expectChainCanonicalEndpoints = (
    canonical: TransactionEntityInterface,
    sourceAccount: AccountEntityInterface,
    targetAccount: AccountEntityInterface
): void => {
    expect(canonical.type).toBe(TransactionTypeEnum.TRANSFER);
    expect(canonical.fromAccountId).toBe(sourceAccount.id);
    expect(canonical.toAccountId).toBe(targetAccount.id);
    expect(canonical.exchangeRate).toBe(CHAIN_RECLAIM_EXCHANGE_RATE);
};
