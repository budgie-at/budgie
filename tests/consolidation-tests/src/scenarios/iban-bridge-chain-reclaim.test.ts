import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import {
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, testSeedService } from '../harness/test-context';

import type {
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface
} from '@budgie/contracts';

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
): TransactionEntityInterface => {
    const directTransfer = testDb
        .insert(TransactionEntityTable)
        .values({
            type: TransactionTypeEnum.TRANSFER,
            title: 'Generated direct transfer',
            externalId: null,
            externalSource: null,
            operatedAt,
            exchangeRate: UAH_TO_EUR_RATE,
            fromAccountId: sourceAccountId,
            toAccountId: targetAccountId,
            comment: '',
            needsEmbedding: false,
            consolidationParentTransactionId: null,
            consolidationType,
            updatedBy: null
        } satisfies TransactionCreateEntityInterface)
        .returning()
        .all()[0];

    if (!isDefined(directTransfer)) {
        throw new Error('Expected direct transfer seed');
    }

    testDb
        .insert(TransactionEntryEntityTable)
        .values([
            {
                transactionId: directTransfer.id,
                accountId: sourceAccountId,
                categoryId: null,
                mccCategoryId: null,
                type: TransactionEntryTypeEnum.CREDIT,
                amount: EUR_AMOUNT,
                externalId: null,
                exchangeRate: UAH_TO_EUR_RATE,
                toIban: TARGET_IBAN,
                originalTransactionId: null
            },
            {
                transactionId: directTransfer.id,
                accountId: targetAccountId,
                categoryId: null,
                mccCategoryId: null,
                type: TransactionEntryTypeEnum.DEBIT,
                amount: UAH_AMOUNT,
                externalId: null,
                exchangeRate: 1,
                toIban: null,
                originalTransactionId: null
            }
        ] satisfies TransactionEntryCreateEntityInterface[])
        .run();

    return directTransfer;
};

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

const expectParent = (sourceTransactionId: number, canonicalTransactionId: number): void => {
    expect(testQueryService.fetchTransactionById(sourceTransactionId).consolidationParentTransactionId).toBe(canonicalTransactionId);
};

const fetchMovedSourceIds = (canonicalTransactionId: number): number[] =>
    testQueryService
        .fetchEntriesByTransactionId(canonicalTransactionId)
        .flatMap(entry => (isDefined(entry.originalTransactionId) ? [entry.originalTransactionId] : []));

describe('consolidation/iban-bridge-chain-reclaim', () => {
    it('reclaims late bridge legs into an existing generated transfer pair', async () => {
        const operatedAt = new Date(2026, 4, 20, 18, 38, 0);
        const transferMcc = testQueryService.findMccByCode('4829');
        const { sourceAccount, bridgeAccount, targetAccount } = seedAccounts();
        const directTransfer = seedDirectTransfer(
            operatedAt,
            sourceAccount.id,
            targetAccount.id,
            TransactionConsolidationTypeEnum.TRANSFER_PAIR
        );
        const { bridgeIncome, bridgeExpense } = seedBridgeLegs(operatedAt, bridgeAccount.id, transferMcc.id);

        const result = await runConsolidation();

        expect(result.groups.existingTransferChainReclaimCandidates).toHaveLength(1);
        expect(result.groups.ibanBridgeTransferCandidates).toHaveLength(0);
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

    it('does not reclaim or duplicate bridge legs when the direct transfer is source-less', async () => {
        const operatedAt = new Date(2026, 4, 20, 18, 38, 0);
        const transferMcc = testQueryService.findMccByCode('4829');
        const { sourceAccount, bridgeAccount, targetAccount } = seedAccounts();
        const directTransfer = seedDirectTransfer(operatedAt, sourceAccount.id, targetAccount.id, null);
        const { bridgeIncome, bridgeExpense } = seedBridgeLegs(operatedAt, bridgeAccount.id, transferMcc.id);

        const result = await runConsolidation();

        expect(result.groups.existingTransferChainReclaimCandidates).toHaveLength(0);
        expect(result.groups.ibanBridgeTransferCandidates).toHaveLength(0);
        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchTransactionById(directTransfer.id).consolidationType).toBeNull();
        expect(testQueryService.fetchTransactionById(bridgeIncome.id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchTransactionById(bridgeExpense.id).consolidationParentTransactionId).toBeNull();
    });
});
