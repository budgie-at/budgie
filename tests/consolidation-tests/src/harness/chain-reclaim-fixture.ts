import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { testDb, testQueryService, testSeedService } from './test-context';

import type { TransactionEntityInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

export const CHAIN_RECLAIM_SOURCE_IBAN = 'UA-RECLAIM-SOURCE-EUR';
export const CHAIN_RECLAIM_TARGET_IBAN = 'UA-RECLAIM-TARGET-UAH';
export const CHAIN_RECLAIM_EUR_AMOUNT = 1_658_290_000;
export const CHAIN_RECLAIM_UAH_AMOUNT = 84_456_700_000;
export const CHAIN_RECLAIM_UAH_TO_EUR_RATE = CHAIN_RECLAIM_EUR_AMOUNT / CHAIN_RECLAIM_UAH_AMOUNT;
export const CHAIN_RECLAIM_ONE_CENT_AMOUNT = 10_000;
export const CHAIN_RECLAIM_STALE_RATE_MULTIPLIER = 2;

const CHAIN_RECLAIM_BRIDGE_IBAN = 'UA-RECLAIM-BRIDGE-UAH';
const CHAIN_RECLAIM_EUR_TO_UAH_RATE = CHAIN_RECLAIM_UAH_AMOUNT / CHAIN_RECLAIM_EUR_AMOUNT;
const CHAIN_RECLAIM_OPERATED_AT = new Date('2026-05-20T18:38:00');

const seedAccounts = () => {
    const eur = testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: 'EUR' });
    const sourceAccount = testSeedService.bankSyncAccount('Reclaim Source EUR', null, CHAIN_RECLAIM_SOURCE_IBAN, eur.id);
    const bridgeAccount = testSeedService.bankSyncAccount('Reclaim Bridge UAH', null, CHAIN_RECLAIM_BRIDGE_IBAN);
    const targetAccount = testSeedService.bankSyncAccount('Reclaim Target UAH', null, CHAIN_RECLAIM_TARGET_IBAN);

    return { sourceAccount, bridgeAccount, targetAccount };
};

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
        operatedAt: CHAIN_RECLAIM_OPERATED_AT,
        sourceAccountId: input.sourceAccountId,
        sourceAmount: input.sourceAmount,
        sourceEntryExchangeRate: input.exchangeRate,
        targetAccountId: input.targetAccountId,
        targetAmount: CHAIN_RECLAIM_UAH_AMOUNT,
        toIban: input.toIban
    });

const seedBridgeLegs = (bridgeAccountId: number, transferMccId: number) => {
    const bridgeIncome = testSeedService.bankPairIncome(
        { externalId: 'reclaim-bridge-income', operatedAt: CHAIN_RECLAIM_OPERATED_AT },
        {
            accountId: bridgeAccountId,
            amount: CHAIN_RECLAIM_UAH_AMOUNT,
            exchangeRate: CHAIN_RECLAIM_EUR_TO_UAH_RATE,
            mccCategoryId: transferMccId,
            toIban: CHAIN_RECLAIM_SOURCE_IBAN
        }
    );
    const bridgeExpense = testSeedService.bankPairExpense(
        { externalId: 'reclaim-bridge-expense', operatedAt: CHAIN_RECLAIM_OPERATED_AT },
        {
            accountId: bridgeAccountId,
            amount: CHAIN_RECLAIM_UAH_AMOUNT,
            mccCategoryId: transferMccId,
            toIban: CHAIN_RECLAIM_TARGET_IBAN
        }
    );

    return { bridgeIncome, bridgeExpense };
};

const seedDirectSourceRows = (sourceAccountId: number, targetAccountId: number, transferMccId: number) => {
    const sourceExpense = testSeedService.bankPairExpense(
        { externalId: 'reclaim-source-expense', operatedAt: CHAIN_RECLAIM_OPERATED_AT },
        {
            accountId: sourceAccountId,
            amount: CHAIN_RECLAIM_EUR_AMOUNT,
            exchangeRate: CHAIN_RECLAIM_UAH_TO_EUR_RATE,
            mccCategoryId: transferMccId,
            toIban: CHAIN_RECLAIM_TARGET_IBAN
        }
    );
    const targetIncome = testSeedService.bankPairIncome(
        { externalId: 'reclaim-target-income', operatedAt: CHAIN_RECLAIM_OPERATED_AT },
        {
            accountId: targetAccountId,
            amount: CHAIN_RECLAIM_UAH_AMOUNT,
            mccCategoryId: transferMccId
        }
    );

    return { sourceExpense, targetIncome };
};

const parentSourceTransaction = async (sourceTransactionId: number, canonicalTransactionId: number): Promise<void> => {
    await testDb.$client.runAsync(
        'UPDATE transaction_entries SET original_transaction_id = ?, transaction_id = ? WHERE transaction_id = ?',
        [sourceTransactionId, canonicalTransactionId, sourceTransactionId]
    );
    await testDb.$client.runAsync('UPDATE transactions SET consolidation_parent_transaction_id = ? WHERE id = ?', [
        canonicalTransactionId,
        sourceTransactionId
    ]);
};

export const seedChainReclaimFixture = (input: {
    readonly consolidationType: TransactionConsolidationTypeEnum | null;
    readonly directExchangeRate?: number;
    readonly directSourceAmount?: number;
    readonly directToIban?: string;
}) => {
    const transferMcc = testQueryService.findMccByCode('4829');
    const { sourceAccount, bridgeAccount, targetAccount } = seedAccounts();
    const sourceAmount = input.directSourceAmount ?? CHAIN_RECLAIM_EUR_AMOUNT;
    const directTransfer = seedDirectTransfer({
        consolidationType: input.consolidationType,
        exchangeRate: input.directExchangeRate ?? sourceAmount / CHAIN_RECLAIM_UAH_AMOUNT,
        sourceAccountId: sourceAccount.id,
        sourceAmount,
        targetAccountId: targetAccount.id,
        toIban: input.directToIban ?? CHAIN_RECLAIM_TARGET_IBAN
    });

    return {
        ...seedBridgeLegs(bridgeAccount.id, transferMcc.id),
        directTransfer,
        sourceAccount,
        targetAccount,
        transferMcc
    };
};

export const seedNestedChainReclaimFixture = async () => {
    const fixture = seedChainReclaimFixture({ consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR });
    const { sourceExpense, targetIncome } = seedDirectSourceRows(
        fixture.sourceAccount.id,
        fixture.targetAccount.id,
        fixture.transferMcc.id
    );

    await parentSourceTransaction(sourceExpense.id, fixture.directTransfer.id);
    await parentSourceTransaction(targetIncome.id, fixture.directTransfer.id);

    return { ...fixture, sourceExpense, targetIncome };
};

export const expectChainReclaimParent = (sourceTransactionId: number, canonicalTransactionId: number): void => {
    expect(testQueryService.fetchTransactionById(sourceTransactionId).consolidationParentTransactionId).toBe(canonicalTransactionId);
};

export const expectChainReclaimUnparented = (sourceTransactionIds: number[]): void => {
    for (const sourceTransactionId of sourceTransactionIds) {
        expect(testQueryService.fetchTransactionById(sourceTransactionId).consolidationParentTransactionId).toBeNull();
    }
};

export const expectAbsorbedIntoExistingTransfer = (directTransferId: number, bridgeIncomeId: number, bridgeExpenseId: number): void => {
    const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);

    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].id).toBe(directTransferId);
    expectChainReclaimParent(bridgeIncomeId, directTransferId);
    expectChainReclaimParent(bridgeExpenseId, directTransferId);
};

export const fetchChainReclaimMovedSourceIds = (canonicalTransactionId: number): number[] =>
    testQueryService
        .fetchEntriesByTransactionId(canonicalTransactionId)
        .flatMap(entry => (isDefined(entry.originalTransactionId) ? [entry.originalTransactionId] : []));

export const fetchChainReclaimOwnLedger = (canonicalTransactionId: number): TransactionEntryEntityInterface[] =>
    testQueryService.fetchEntriesByTransactionId(canonicalTransactionId).filter(entry => !isDefined(entry.originalTransactionId));

export const fetchChainReclaimLedgerEntry = (canonicalTransactionId: number, accountId: number): TransactionEntryEntityInterface => {
    const entry = fetchChainReclaimOwnLedger(canonicalTransactionId).find(candidate => candidate.accountId === accountId);

    if (!isDefined(entry)) {
        throw new Error(`Ledger entry for account ${accountId} on transaction ${canonicalTransactionId} not found`);
    }

    return entry;
};
