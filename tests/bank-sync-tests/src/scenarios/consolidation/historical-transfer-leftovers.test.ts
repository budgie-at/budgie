import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import {
    AccountTypeEnum,
    ExchangeRateCreateEntityInterface,
    ExchangeRateEntityTable,
    TransactionConsolidationTypeEnum,
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntityTable,
    TransactionEntryCreateEntityInterface,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { fetchCanonicalsOfType, fetchTransactionById, findMccByCode, seed, seedBankPair, testDb } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

const SOURCE_IBAN = 'UA-FOP-EUR';
const BRIDGE_IBAN = 'UA-FOP-UAH';
const BLACK_IBAN = 'UA-BLACK-UAH';
const PRIVAT_IBAN = 'UA-PRIVAT-UAH';
const EUR_AMOUNT = 238_000_000;
const UAH_AMOUNT = 11_745_300_000;
const EUR_TO_UAH_RATE = UAH_AMOUNT / EUR_AMOUNT;

const seedExchangeRate = (baseInstrumentId: number, quoteInstrumentId: number, rate: number): void => {
    testDb
        .insert(ExchangeRateEntityTable)
        .values({
            source: 'test',
            baseInstrumentId,
            quoteInstrumentId,
            rate
        } satisfies ExchangeRateCreateEntityInterface)
        .run();
};

const seedTransfer = (
    title: string,
    operatedAt: Date,
    fromAccountId: number,
    toAccountId: number,
    amount: number
): TransactionEntityInterface => {
    const transfer = testDb
        .insert(TransactionEntityTable)
        .values({
            type: TransactionTypeEnum.TRANSFER,
            title,
            externalId: null,
            externalSource: null,
            operatedAt,
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
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
                transactionId: transfer.id,
                accountId: fromAccountId,
                categoryId: null,
                mccCategoryId: null,
                type: TransactionEntryTypeEnum.CREDIT,
                amount,
                externalId: null,
                exchangeRate: 1,
                toIban: null,
                originalTransactionId: null
            },
            {
                transactionId: transfer.id,
                accountId: toAccountId,
                categoryId: null,
                mccCategoryId: null,
                type: TransactionEntryTypeEnum.DEBIT,
                amount,
                externalId: null,
                exchangeRate: 1,
                toIban: null,
                originalTransactionId: null
            }
        ] satisfies TransactionEntryCreateEntityInterface[])
        .run();

    return transfer;
};

const fetchMovedSourceIds = (canonicalId: number): number[] =>
    testDb
        .select()
        .from(TransactionEntryEntityTable)
        .where(eq(TransactionEntryEntityTable.transactionId, canonicalId))
        .all()
        .flatMap(entry => (entry.originalTransactionId ? [entry.originalTransactionId] : []));

describe('consolidation/historical-transfer-leftovers', () => {
    it('folds a past currency-exchange bridge leftover into the existing card transfer', async () => {
        const operatedAt = new Date(2026, 0, 5, 13, 56, 33);
        const eur = seed.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
        const sourceAccount = seed.account({
            title: 'Monobank Fop EUR',
            type: AccountTypeEnum.BANK_SYNC,
            iban: SOURCE_IBAN,
            instrumentId: eur.id
        });
        const bridgeAccount = seed.account({ title: 'Monobank Fop UAH', type: AccountTypeEnum.BANK_SYNC, iban: BRIDGE_IBAN });
        const targetAccount = seed.account({ title: 'Monobank Black', type: AccountTypeEnum.BANK_SYNC, iban: BLACK_IBAN });

        seedExchangeRate(eur.id, bridgeAccount.instrumentId, EUR_TO_UAH_RATE);
        const sourceExpense = seedBankPair.expense(
            { externalId: 'eur-to-uah-expense', operatedAt: new Date(operatedAt.getTime() + 1000) },
            { accountId: sourceAccount.id, amount: EUR_AMOUNT }
        );
        const bridgeIncome = seedBankPair.income(
            { externalId: 'eur-to-uah-income', operatedAt },
            { accountId: bridgeAccount.id, amount: UAH_AMOUNT }
        );
        const existingCardTransfer = seedTransfer('На чорну картку', operatedAt, bridgeAccount.id, targetAccount.id, UAH_AMOUNT);

        const result = await transferConsolidationService.consolidate();

        expect(result).toEqual({ found: 1, consolidated: 1 });

        const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);
        expect(canonicals).toHaveLength(1);
        expect(canonicals[0].fromAccountId).toBe(sourceAccount.id);
        expect(canonicals[0].toAccountId).toBe(targetAccount.id);
        expect(fetchTransactionById(sourceExpense.id).consolidationParentTransactionId).toBe(canonicals[0].id);
        expect(fetchTransactionById(bridgeIncome.id).consolidationParentTransactionId).toBe(canonicals[0].id);
        expect(fetchTransactionById(existingCardTransfer.id).consolidationParentTransactionId).toBe(canonicals[0].id);
        expect(fetchMovedSourceIds(canonicals[0].id).sort((left, right) => left - right)).toEqual(
            [sourceExpense.id, bridgeIncome.id, existingCardTransfer.id, existingCardTransfer.id].sort((left, right) => left - right)
        );
    });

    it('parents the closest past income duplicate to an existing same-currency transfer', async () => {
        const operatedAt = new Date(2026, 0, 5, 13, 56, 56);
        const sourceAccount = seed.account({
            title: 'Monobank Black',
            type: AccountTypeEnum.BANK_SYNC,
            iban: BLACK_IBAN
        });
        const targetAccount = seed.account({
            title: 'Privatbank',
            type: AccountTypeEnum.BANK_SYNC,
            iban: PRIVAT_IBAN
        });
        const transferMcc = findMccByCode('4829');
        const existingTransfer = seedTransfer('Приват Сина', operatedAt, sourceAccount.id, targetAccount.id, UAH_AMOUNT);
        const closestIncome = seedBankPair.income(
            { externalId: 'privat-income-closest', operatedAt: new Date(operatedAt.getTime() + 60 * 60 * 1000) },
            { accountId: targetAccount.id, amount: UAH_AMOUNT, mccCategoryId: transferMcc.id }
        );
        const laterIncome = seedBankPair.income(
            { externalId: 'privat-income-later', operatedAt: new Date(operatedAt.getTime() + 2 * 60 * 60 * 1000) },
            { accountId: targetAccount.id, amount: UAH_AMOUNT, mccCategoryId: transferMcc.id }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result).toEqual({ found: 1, consolidated: 1 });
        expect(fetchTransactionById(existingTransfer.id).consolidationType).toBe(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(fetchTransactionById(closestIncome.id).consolidationParentTransactionId).toBe(existingTransfer.id);
        expect(fetchTransactionById(laterIncome.id).consolidationParentTransactionId).toBeNull();
        expect(fetchMovedSourceIds(existingTransfer.id)).toEqual([closestIncome.id]);
    });
});
