import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect } from 'vitest';

import { expectConsolidationParent } from './consolidation-revert-audit';
import {
    IBAN_BRIDGE_EUR_AMOUNT,
    IBAN_BRIDGE_OPERATED_AT,
    IBAN_BRIDGE_TARGET_IBAN,
    IBAN_BRIDGE_UAH_AMOUNT,
    parentConsolidationSource,
    seedIbanBridgeLegs,
    seedIbanBridgeSourceExpense,
    seedIbanBridgeTargetIncome,
    seedIbanBridgeTopology
} from './iban-bridge-topology';
import { testQueryService, testSeedService } from './test-context';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

export const CHAIN_RECLAIM_ONE_CENT_AMOUNT = 10_000;
export const CHAIN_RECLAIM_STALE_RATE_MULTIPLIER = 2;

const seedDirectTransfer = (input: {
    readonly consolidationType: TransactionConsolidationTypeEnum | null;
    readonly exchangeRate: number;
    readonly sourceAccountId: number;
    readonly sourceAmount: number;
    readonly targetAccountId: number;
    readonly toIban: string;
}): TransactionEntityInterface =>
    testSeedService.directTransfer({
        consolidationType: input.consolidationType,
        exchangeRate: input.exchangeRate,
        operatedAt: IBAN_BRIDGE_OPERATED_AT,
        sourceAccountId: input.sourceAccountId,
        sourceAmount: input.sourceAmount,
        sourceEntryExchangeRate: input.exchangeRate,
        targetAccountId: input.targetAccountId,
        targetAmount: IBAN_BRIDGE_UAH_AMOUNT,
        toIban: input.toIban
    });

export const seedChainReclaimFixture = (input: {
    readonly consolidationType: TransactionConsolidationTypeEnum | null;
    readonly directExchangeRate?: number;
    readonly directSourceAmount?: number;
    readonly directToIban?: string;
}): {
    readonly bridgeAccount: AccountEntityInterface;
    readonly bridgeExpense: TransactionEntityInterface;
    readonly bridgeIncome: TransactionEntityInterface;
    readonly directTransfer: TransactionEntityInterface;
    readonly sourceAccount: AccountEntityInterface;
    readonly targetAccount: AccountEntityInterface;
    readonly transferMccId: number;
} => {
    const { sourceAccount, bridgeAccount, targetAccount, transferMccId } = seedIbanBridgeTopology();
    const sourceAmount = input.directSourceAmount ?? IBAN_BRIDGE_EUR_AMOUNT;
    const directTransfer = seedDirectTransfer({
        consolidationType: input.consolidationType,
        exchangeRate: input.directExchangeRate ?? sourceAmount / IBAN_BRIDGE_UAH_AMOUNT,
        sourceAccountId: sourceAccount.id,
        sourceAmount,
        targetAccountId: targetAccount.id,
        toIban: input.directToIban ?? IBAN_BRIDGE_TARGET_IBAN
    });

    return {
        ...seedIbanBridgeLegs(bridgeAccount.id, transferMccId),
        bridgeAccount,
        directTransfer,
        sourceAccount,
        targetAccount,
        transferMccId
    };
};

export const seedNestedChainReclaimFixture = async (
    input: {
        readonly directExchangeRate?: number;
        readonly directToIban?: string;
    } = {}
) => {
    const fixture = seedChainReclaimFixture({ consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR, ...input });
    const sourceExpense = seedIbanBridgeSourceExpense(fixture.sourceAccount.id, fixture.transferMccId);
    const targetIncome = seedIbanBridgeTargetIncome(fixture.targetAccount.id, fixture.transferMccId);

    await parentConsolidationSource(sourceExpense.id, fixture.directTransfer.id);
    await parentConsolidationSource(targetIncome.id, fixture.directTransfer.id);

    return { ...fixture, sourceExpense, targetIncome };
};

export const expectAbsorbedIntoExistingTransfer = (directTransferId: number, bridgeIncomeId: number, bridgeExpenseId: number): void => {
    const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);

    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].id).toBe(directTransferId);
    expectConsolidationParent(bridgeIncomeId, directTransferId);
    expectConsolidationParent(bridgeExpenseId, directTransferId);
};
