import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import {
    TransactionConsolidationTypeEnum,
    TransactionEntityInterface,
    TransactionEntryEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';

import {
    expectSingleConsolidation,
    fetchCanonicalsOfType,
    fetchTransactionById,
    findMccByCode,
    seed,
    seedBankPair,
    seedBankSyncAccount,
    testDb
} from '../../harness';

import { consolidationScopeService } from '@budgie/consolidation';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

const SOURCE_IBAN = 'UA-SOURCE-EUR';
const BRIDGE_IBAN = 'UA-BRIDGE-UAH';
const TARGET_IBAN = 'UA-TARGET-UAH';
const EUR_AMOUNT = 1_658_290_000;
const UAH_AMOUNT = 84_456_700_000;
const EUR_TO_UAH_RATE = UAH_AMOUNT / EUR_AMOUNT;
const UAH_TO_EUR_RATE = EUR_AMOUNT / UAH_AMOUNT;

const seedBridgeAccounts = () => {
    const transferMcc = findMccByCode('4829');
    const eur = seed.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
    const sourceAccount = seedBankSyncAccount('Monobank Fop EUR', null, SOURCE_IBAN, eur.id);
    const bridgeAccount = seedBankSyncAccount('Monobank Fop UAH', null, BRIDGE_IBAN);
    const targetAccount = seedBankSyncAccount('Monobank Black', null, TARGET_IBAN);

    return { transferMcc, sourceAccount, bridgeAccount, targetAccount };
};

const seedBridgeRows = (operatedAt: Date, bridgeAccountId: number, transferMccId: number) => {
    const bridgeIncome = seedBankPair.income(
        { externalId: 'bridge-income', operatedAt },
        {
            accountId: bridgeAccountId,
            amount: UAH_AMOUNT,
            exchangeRate: EUR_TO_UAH_RATE,
            mccCategoryId: transferMccId,
            toIban: SOURCE_IBAN
        }
    );
    const bridgeExpense = seedBankPair.expense(
        { externalId: 'bridge-expense', operatedAt },
        {
            accountId: bridgeAccountId,
            amount: UAH_AMOUNT,
            mccCategoryId: transferMccId,
            toIban: TARGET_IBAN
        }
    );

    return { bridgeIncome, bridgeExpense };
};

const seedTargetIncome = (externalId: string, operatedAt: Date, targetAccountId: number, transferMccId: number) =>
    seedBankPair.income(
        { externalId, operatedAt },
        {
            accountId: targetAccountId,
            amount: UAH_AMOUNT,
            mccCategoryId: transferMccId
        }
    );

const seedDirectTransfer = (
    operatedAt: Date,
    sourceAccountId: number,
    targetAccountId: number,
    consolidationType: TransactionConsolidationTypeEnum | null = null
): TransactionEntityInterface =>
    seed.directTransfer({
        consolidationType,
        exchangeRate: UAH_TO_EUR_RATE,
        operatedAt,
        sourceAccountId,
        sourceAmount: EUR_AMOUNT,
        sourceEntryExchangeRate: UAH_TO_EUR_RATE,
        targetAccountId,
        targetAmount: UAH_AMOUNT,
        toIban: TARGET_IBAN,
        title: 'На чорну картку'
    });

const seedBridgeReclaimFixture = (consolidationType: TransactionConsolidationTypeEnum | null) => {
    const operatedAt = new Date(2026, 4, 20, 18, 38, 0);
    const { transferMcc, sourceAccount, bridgeAccount, targetAccount } = seedBridgeAccounts();
    const directTransfer = seedDirectTransfer(operatedAt, sourceAccount.id, targetAccount.id, consolidationType);
    const { bridgeIncome, bridgeExpense } = seedBridgeRows(operatedAt, bridgeAccount.id, transferMcc.id);

    return { bridgeExpense, bridgeIncome, directTransfer, sourceAccount, targetAccount };
};

const buildBridgeScope = (transactions: Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[]) => {
    const scope = consolidationScopeService.buildFromTransactions(transactions);

    if (!isDefined(scope)) {
        throw new Error('Expected bridge rows to build a consolidation scope');
    }

    return scope;
};

const fetchMovedSourceIds = (canonicalId: number): number[] => {
    const movedEntries = testDb
        .select()
        .from(TransactionEntryEntityTable)
        .where(eq(TransactionEntryEntityTable.transactionId, canonicalId))
        .all();

    return movedEntries.flatMap(entry => (entry.originalTransactionId ? [entry.originalTransactionId] : []));
};

const expectCanonicalTransfer = (
    consolidationType: TransactionConsolidationTypeEnum,
    sourceAccountId: number,
    targetAccountId: number
): number => {
    expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);

    const canonicals = fetchCanonicalsOfType(consolidationType);
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].type).toBe(TransactionTypeEnum.TRANSFER);
    expect(canonicals[0].fromAccountId).toBe(sourceAccountId);
    expect(canonicals[0].toAccountId).toBe(targetAccountId);

    return canonicals[0].id;
};

const expectSourcesParented = (canonicalId: number, sourceTransactionIds: number[]): void => {
    for (const sourceTransactionId of sourceTransactionIds) {
        expect(fetchTransactionById(sourceTransactionId).consolidationParentTransactionId).toBe(canonicalId);
    }
};

const expectMovedSources = (canonicalId: number, expectedSourceIds: number[]): void => {
    const sourceIds = fetchMovedSourceIds(canonicalId);

    expect(sourceIds.sort((left, right) => left - right)).toEqual(expectedSourceIds.sort((left, right) => left - right));
};

const expectBridgeReclaimedIntoDirectTransfer = (
    directTransferId: number,
    sourceAccountId: number,
    targetAccountId: number,
    sourceIds: number[]
): void => {
    expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);

    const canonicalId = expectCanonicalTransfer(
        TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
        sourceAccountId,
        targetAccountId
    );

    expect(canonicalId).toBe(directTransferId);
    expectSourcesParented(canonicalId, sourceIds);
    expectMovedSources(canonicalId, sourceIds);
};

describe('consolidation/iban-bridge-chain-transfer', () => {
    it('collapses a technical bridge chain into one direct canonical transfer', async () => {
        const operatedAt = new Date(2026, 4, 20, 18, 38, 0);
        const { transferMcc, sourceAccount, bridgeAccount, targetAccount } = seedBridgeAccounts();
        const sourceExpense = seedBankPair.expense(
            { externalId: 'source-expense', operatedAt },
            {
                accountId: sourceAccount.id,
                amount: EUR_AMOUNT,
                exchangeRate: UAH_TO_EUR_RATE,
                mccCategoryId: transferMcc.id,
                toIban: TARGET_IBAN
            }
        );
        const { bridgeIncome, bridgeExpense } = seedBridgeRows(operatedAt, bridgeAccount.id, transferMcc.id);
        const targetIncome = seedTargetIncome('target-income', operatedAt, targetAccount.id, transferMcc.id);

        await expectSingleConsolidation();

        const canonicalId = expectCanonicalTransfer(
            TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
            sourceAccount.id,
            targetAccount.id
        );
        const sourceIds = [sourceExpense.id, bridgeIncome.id, bridgeExpense.id, targetIncome.id];

        expectSourcesParented(canonicalId, sourceIds);
        expectMovedSources(canonicalId, sourceIds);
    });

    it('reclaims a generated direct transfer pair before generic bridge consolidation in a full scan', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer, sourceAccount, targetAccount } = seedBridgeReclaimFixture(
            TransactionConsolidationTypeEnum.TRANSFER_PAIR
        );

        await expectSingleConsolidation();

        expectBridgeReclaimedIntoDirectTransfer(directTransfer.id, sourceAccount.id, targetAccount.id, [bridgeIncome.id, bridgeExpense.id]);
    });

    it('reclaims late bridge legs into an existing direct transfer pair inside a scoped sync scan', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer, sourceAccount, targetAccount } = seedBridgeReclaimFixture(
            TransactionConsolidationTypeEnum.TRANSFER_PAIR
        );
        const scope = buildBridgeScope([bridgeIncome, bridgeExpense]);

        const result = await transferConsolidationService.consolidate(scope);

        expect(result.found).toBe(1);
        expect(result.consolidated).toBe(1);
        expectBridgeReclaimedIntoDirectTransfer(directTransfer.id, sourceAccount.id, targetAccount.id, [bridgeIncome.id, bridgeExpense.id]);
    });

    it('does not reclaim late bridge legs into a source-less hand-created transfer', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer } = seedBridgeReclaimFixture(null);
        const scope = buildBridgeScope([bridgeIncome, bridgeExpense]);

        const result = await transferConsolidationService.consolidate(scope);

        expect(result.found).toBe(0);
        expect(result.consolidated).toBe(0);
        expect(fetchTransactionById(directTransfer.id).consolidationType).toBeNull();
        expect(fetchTransactionById(bridgeIncome.id).consolidationParentTransactionId).toBeNull();
        expect(fetchTransactionById(bridgeExpense.id).consolidationParentTransactionId).toBeNull();
    });

    it('attaches leftover technical source and target rows to an existing bridge canonical transfer', async () => {
        const operatedAt = new Date(2026, 4, 21, 13, 50, 4);
        const { transferMcc, sourceAccount, targetAccount } = seedBridgeAccounts();
        const canonicalTransfer = seedDirectTransfer(
            operatedAt,
            sourceAccount.id,
            targetAccount.id,
            TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER
        );
        const sourceExpense = seedBankPair.expense(
            { externalId: 'leftover-source-expense', operatedAt },
            {
                accountId: sourceAccount.id,
                amount: EUR_AMOUNT,
                exchangeRate: UAH_TO_EUR_RATE,
                mccCategoryId: transferMcc.id,
                toIban: TARGET_IBAN
            }
        );
        const targetIncome = seedTargetIncome(
            'leftover-target-income',
            new Date(operatedAt.getTime() + 1000),
            targetAccount.id,
            transferMcc.id
        );

        await expectSingleConsolidation();
        expectCanonicalTransfer(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER, sourceAccount.id, targetAccount.id);
        expect(fetchTransactionById(canonicalTransfer.id).consolidationParentTransactionId).toBeNull();
        expectSourcesParented(canonicalTransfer.id, [sourceExpense.id, targetIncome.id]);
        expectMovedSources(canonicalTransfer.id, [sourceExpense.id, targetIncome.id]);
    });
});
