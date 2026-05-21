import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import {
    AccountTypeEnum,
    TransactionConsolidationTypeEnum,
    TransactionCreateEntityInterface,
    TransactionEntityTable,
    TransactionEntryCreateEntityInterface,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { fetchCanonicalsOfType, fetchTransactionById, findMccByCode, seed, seedBankPair, testDb } from '../../harness';

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
    const sourceAccount = seed.account({
        title: 'Monobank Fop EUR',
        type: AccountTypeEnum.BANK_SYNC,
        instrumentId: eur.id,
        iban: SOURCE_IBAN
    });
    const bridgeAccount = seed.account({
        title: 'Monobank Fop UAH',
        type: AccountTypeEnum.BANK_SYNC,
        iban: BRIDGE_IBAN
    });
    const targetAccount = seed.account({
        title: 'Monobank Black',
        type: AccountTypeEnum.BANK_SYNC,
        iban: TARGET_IBAN
    });

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
        const targetIncome = seedBankPair.income(
            { externalId: 'target-income', operatedAt },
            {
                accountId: targetAccount.id,
                amount: UAH_AMOUNT,
                mccCategoryId: transferMcc.id
            }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(1);
        expect(result.found).toBe(1);

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
        const directTransfer = testDb
            .insert(TransactionEntityTable)
            .values({
                type: TransactionTypeEnum.TRANSFER,
                title: 'На чорну картку',
                externalId: null,
                externalSource: null,
                operatedAt,
                exchangeRate: UAH_TO_EUR_RATE,
                fromAccountId: sourceAccount.id,
                toAccountId: targetAccount.id,
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
                    accountId: sourceAccount.id,
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
                    accountId: targetAccount.id,
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

        const { bridgeIncome, bridgeExpense } = seedBridgeRows(operatedAt, bridgeAccount.id, transferMcc.id);

        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(1);
        expect(result.found).toBe(1);

        const canonicalId = expectCanonicalTransfer(
            TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
            sourceAccount.id,
            targetAccount.id
        );
        const sourceIds = [directTransfer.id, bridgeIncome.id, bridgeExpense.id];

        expectSourcesParented(canonicalId, sourceIds);
        expectMovedSources(canonicalId, [directTransfer.id, ...sourceIds]);
    });
});
