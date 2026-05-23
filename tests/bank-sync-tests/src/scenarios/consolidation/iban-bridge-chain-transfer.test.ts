import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import {
    ExchangeRateCreateEntityInterface,
    ExchangeRateEntityTable,
    TransactionConsolidationTypeEnum,
    TransactionCreateEntityInterface,
    TransactionEntityTable,
    TransactionEntryCreateEntityInterface,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
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

const SOURCE_IBAN = 'UA003220010000SOURCEEUR';
const BRIDGE_IBAN = 'UA003220010000BRIDGEUAH';
const TARGET_IBAN = 'UA003220010000TARGETUAH';
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
) => {
    const directTransfer = testDb
        .insert(TransactionEntityTable)
        .values({
            type: TransactionTypeEnum.TRANSFER,
            title: 'На чорну картку',
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
        .get();

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

const seedLegacyDirectBridgeTransfer = (operatedAt: Date, bridgeAccountId: number, targetAccountId: number) => {
    const directTransfer = testDb
        .insert(TransactionEntityTable)
        .values({
            type: TransactionTypeEnum.TRANSFER,
            title: 'На чорну картку',
            externalId: null,
            externalSource: null,
            operatedAt,
            exchangeRate: 1,
            fromAccountId: bridgeAccountId,
            toAccountId: targetAccountId,
            comment: '',
            needsEmbedding: false,
            consolidationParentTransactionId: null,
            consolidationType: null,
            updatedBy: null
        } satisfies TransactionCreateEntityInterface)
        .returning()
        .get();

    testDb
        .insert(TransactionEntryEntityTable)
        .values([
            {
                transactionId: directTransfer.id,
                accountId: bridgeAccountId,
                categoryId: null,
                mccCategoryId: null,
                type: TransactionEntryTypeEnum.CREDIT,
                amount: UAH_AMOUNT,
                externalId: null,
                exchangeRate: 1,
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

const seedLegacyExchangeRate = (sourceInstrumentId: number, bridgeInstrumentId: number): void => {
    testDb
        .insert(ExchangeRateEntityTable)
        .values({
            source: 'test',
            baseInstrumentId: sourceInstrumentId,
            quoteInstrumentId: bridgeInstrumentId,
            rate: EUR_TO_UAH_RATE
        } satisfies ExchangeRateCreateEntityInterface)
        .run();
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

    it('prioritizes bridge consolidation over the generic technical pair when a direct transfer exists', async () => {
        const operatedAt = new Date(2026, 4, 20, 18, 38, 0);
        const { transferMcc, sourceAccount, bridgeAccount, targetAccount } = seedBridgeAccounts();
        const directTransfer = seedDirectTransfer(operatedAt, sourceAccount.id, targetAccount.id);
        const { bridgeIncome, bridgeExpense } = seedBridgeRows(operatedAt, bridgeAccount.id, transferMcc.id);

        await expectSingleConsolidation();

        const canonicalId = expectCanonicalTransfer(
            TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
            sourceAccount.id,
            targetAccount.id
        );
        const sourceIds = [directTransfer.id, bridgeIncome.id, bridgeExpense.id];

        expectSourcesParented(canonicalId, sourceIds);
        expectMovedSources(canonicalId, [directTransfer.id, ...sourceIds]);
    });

    it('collapses a legacy bridge pair around an existing bridge-to-target transfer without entry IBANs', async () => {
        const operatedAt = new Date(2026, 0, 5, 14, 47, 0);
        const { transferMcc, sourceAccount, bridgeAccount, targetAccount } = seedBridgeAccounts();
        const directTransfer = seedLegacyDirectBridgeTransfer(operatedAt, bridgeAccount.id, targetAccount.id);
        const sourceExpense = seedBankPair.expense(
            { externalId: 'legacy-source-expense', operatedAt },
            {
                accountId: sourceAccount.id,
                amount: EUR_AMOUNT,
                exchangeRate: UAH_TO_EUR_RATE,
                mccCategoryId: transferMcc.id
            }
        );
        const bridgeIncome = seedBankPair.income(
            { externalId: 'legacy-bridge-income', operatedAt },
            {
                accountId: bridgeAccount.id,
                amount: UAH_AMOUNT,
                exchangeRate: EUR_TO_UAH_RATE,
                mccCategoryId: transferMcc.id
            }
        );

        seedLegacyExchangeRate(sourceAccount.instrumentId, bridgeAccount.instrumentId);

        await expectSingleConsolidation();

        const canonicalId = expectCanonicalTransfer(
            TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
            sourceAccount.id,
            targetAccount.id
        );
        const sourceIds = [directTransfer.id, sourceExpense.id, bridgeIncome.id];

        expectSourcesParented(canonicalId, sourceIds);
        expectMovedSources(canonicalId, [directTransfer.id, ...sourceIds]);
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
