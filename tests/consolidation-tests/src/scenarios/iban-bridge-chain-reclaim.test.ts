import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, testSeedService } from '../harness/test-context';

import type { TransactionEntityInterface } from '@budgie/contracts';

const SOURCE_IBAN = 'UA-RECLAIM-SOURCE-EUR';
const BRIDGE_IBAN = 'UA-RECLAIM-BRIDGE-UAH';
const TARGET_IBAN = 'UA-RECLAIM-TARGET-UAH';
const EUR_AMOUNT = 1_658_290_000;
const UAH_AMOUNT = 84_456_700_000;
const EUR_TO_UAH_RATE = UAH_AMOUNT / EUR_AMOUNT;
const UAH_TO_EUR_RATE = EUR_AMOUNT / UAH_AMOUNT;

const seedAccounts = () => {
    const eur = testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: 'EUR' });
    const sourceAccount = testSeedService.bankSyncAccount('Reclaim Source EUR', null, SOURCE_IBAN, eur.id);
    const bridgeAccount = testSeedService.bankSyncAccount('Reclaim Bridge UAH', null, BRIDGE_IBAN);
    const targetAccount = testSeedService.bankSyncAccount('Reclaim Target UAH', null, TARGET_IBAN);

    return { sourceAccount, bridgeAccount, targetAccount };
};

const seedDirectTransfer = (
    operatedAt: Date,
    sourceAccountId: number,
    targetAccountId: number,
    consolidationType: TransactionConsolidationTypeEnum | null
): TransactionEntityInterface =>
    testSeedService.directTransfer({
        consolidationType,
        exchangeRate: UAH_TO_EUR_RATE,
        operatedAt,
        sourceAccountId,
        sourceAmount: EUR_AMOUNT,
        sourceEntryExchangeRate: UAH_TO_EUR_RATE,
        targetAccountId,
        targetAmount: UAH_AMOUNT,
        toIban: TARGET_IBAN
    });

const seedBridgeLegs = (operatedAt: Date, bridgeAccountId: number, transferMccId: number) => {
    const bridgeIncome = testSeedService.bankPairIncome(
        { externalId: 'reclaim-bridge-income', operatedAt },
        {
            accountId: bridgeAccountId,
            amount: UAH_AMOUNT,
            exchangeRate: EUR_TO_UAH_RATE,
            mccCategoryId: transferMccId,
            toIban: SOURCE_IBAN
        }
    );
    const bridgeExpense = testSeedService.bankPairExpense(
        { externalId: 'reclaim-bridge-expense', operatedAt },
        {
            accountId: bridgeAccountId,
            amount: UAH_AMOUNT,
            mccCategoryId: transferMccId,
            toIban: TARGET_IBAN
        }
    );

    return { bridgeIncome, bridgeExpense };
};

const seedDirectSourceRows = (operatedAt: Date, sourceAccountId: number, targetAccountId: number, transferMccId: number) => {
    const sourceExpense = testSeedService.bankPairExpense(
        { externalId: 'reclaim-source-expense', operatedAt },
        {
            accountId: sourceAccountId,
            amount: EUR_AMOUNT,
            exchangeRate: UAH_TO_EUR_RATE,
            mccCategoryId: transferMccId,
            toIban: TARGET_IBAN
        }
    );
    const targetIncome = testSeedService.bankPairIncome(
        { externalId: 'reclaim-target-income', operatedAt },
        {
            accountId: targetAccountId,
            amount: UAH_AMOUNT,
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

const seedGeneratedTransferReclaimFixture = () => {
    const operatedAt = new Date(2026, 4, 20, 18, 38, 0);
    const transferMcc = testQueryService.findMccByCode('4829');
    const { sourceAccount, bridgeAccount, targetAccount } = seedAccounts();
    const directTransfer = seedDirectTransfer(
        operatedAt,
        sourceAccount.id,
        targetAccount.id,
        TransactionConsolidationTypeEnum.TRANSFER_PAIR
    );
    const bridgeLegs = seedBridgeLegs(operatedAt, bridgeAccount.id, transferMcc.id);

    return {
        ...bridgeLegs,
        directTransfer,
        operatedAt,
        sourceAccount,
        targetAccount,
        transferMcc
    };
};

const expectParent = (sourceTransactionId: number, canonicalTransactionId: number): void => {
    expect(testQueryService.fetchTransactionById(sourceTransactionId).consolidationParentTransactionId).toBe(canonicalTransactionId);
};

const fetchMovedSourceIds = (canonicalTransactionId: number): number[] =>
    testQueryService
        .fetchEntriesByTransactionId(canonicalTransactionId)
        .flatMap(entry => (isDefined(entry.originalTransactionId) ? [entry.originalTransactionId] : []));

describe('consolidation/iban-bridge-chain-reclaim', () => {
    it('reclaims late bridge legs into an existing generated transfer pair', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer } = seedGeneratedTransferReclaimFixture();

        const result = await runConsolidation();

        expect(result.found).toBe(1);
        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);
        const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);
        expect(canonicals).toHaveLength(1);
        expect(canonicals[0].id).toBe(directTransfer.id);
        expectParent(bridgeIncome.id, directTransfer.id);
        expectParent(bridgeExpense.id, directTransfer.id);
        expect(fetchMovedSourceIds(directTransfer.id).sort((left, right) => left - right)).toEqual(
            [bridgeIncome.id, bridgeExpense.id].sort((left, right) => left - right)
        );
    });

    it('preserves original moved source rows when reclaiming bridge legs into an existing generated transfer pair', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer, operatedAt, sourceAccount, targetAccount, transferMcc } =
            seedGeneratedTransferReclaimFixture();
        const { sourceExpense, targetIncome } = seedDirectSourceRows(operatedAt, sourceAccount.id, targetAccount.id, transferMcc.id);

        await parentSourceTransaction(sourceExpense.id, directTransfer.id);
        await parentSourceTransaction(targetIncome.id, directTransfer.id);

        const result = await runConsolidation();

        expect(result.found).toBe(1);
        expect(result.consolidated).toBe(1);
        expect(testQueryService.fetchTransactionById(directTransfer.id).consolidationType).toBe(
            TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER
        );
        expectParent(sourceExpense.id, directTransfer.id);
        expectParent(targetIncome.id, directTransfer.id);
        expectParent(bridgeIncome.id, directTransfer.id);
        expectParent(bridgeExpense.id, directTransfer.id);
        expect(fetchMovedSourceIds(directTransfer.id).sort((left, right) => left - right)).toEqual(
            [sourceExpense.id, targetIncome.id, bridgeIncome.id, bridgeExpense.id].sort((left, right) => left - right)
        );
    });

    it('does not reclaim or duplicate bridge legs when the direct transfer is source-less', async () => {
        const operatedAt = new Date(2026, 4, 20, 18, 38, 0);
        const transferMcc = testQueryService.findMccByCode('4829');
        const { sourceAccount, bridgeAccount, targetAccount } = seedAccounts();
        const directTransfer = seedDirectTransfer(operatedAt, sourceAccount.id, targetAccount.id, null);
        const { bridgeIncome, bridgeExpense } = seedBridgeLegs(operatedAt, bridgeAccount.id, transferMcc.id);

        const result = await runConsolidation();

        expect(result.found).toBe(0);
        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchTransactionById(directTransfer.id).consolidationType).toBeNull();
        expect(testQueryService.fetchTransactionById(bridgeIncome.id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchTransactionById(bridgeExpense.id).consolidationParentTransactionId).toBeNull();
    });
});
