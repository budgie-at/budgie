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

const seedHistoricalBridgeAccounts = () => {
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

    return { sourceAccount, bridgeAccount, targetAccount };
};

const seedTransfer = (
    title: string,
    operatedAt: Date,
    fromAccountId: number,
    toAccountId: number,
    amount: number,
    consolidationType: TransactionConsolidationTypeEnum | null = null
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
            consolidationType,
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

const seedMovedSourceEntry = (canonicalTransactionId: number, accountId: number): TransactionEntityInterface => {
    const movedSource = seedBankPair.expense(
        { externalId: 'already-moved-source', operatedAt: new Date(2026, 0, 4) },
        { accountId, amount: 1_000_000 }
    );

    testDb
        .insert(TransactionEntryEntityTable)
        .values({
            transactionId: canonicalTransactionId,
            accountId,
            categoryId: null,
            mccCategoryId: null,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: 1_000_000,
            externalId: 'already-moved-source',
            exchangeRate: 1,
            toIban: null,
            originalTransactionId: movedSource.id
        } satisfies TransactionEntryCreateEntityInterface)
        .run();

    testDb
        .update(TransactionEntityTable)
        .set({ consolidationParentTransactionId: canonicalTransactionId })
        .where(eq(TransactionEntityTable.id, movedSource.id))
        .run();

    return movedSource;
};

const seedExistingTransferBridgeCandidate = (
    externalIdPrefix: string,
    title: string,
    consolidationType: TransactionConsolidationTypeEnum | null = null
) => {
    const operatedAt = new Date(2026, 0, 5, 13, 56, 33);
    const { bridgeAccount, sourceAccount, targetAccount } = seedHistoricalBridgeAccounts();
    const sourceExpense = seedBankPair.expense(
        { externalId: `${externalIdPrefix}-expense`, operatedAt: new Date(operatedAt.getTime() + 1000) },
        { accountId: sourceAccount.id, amount: EUR_AMOUNT }
    );
    const bridgeIncome = seedBankPair.income(
        { externalId: `${externalIdPrefix}-income`, operatedAt },
        { accountId: bridgeAccount.id, amount: UAH_AMOUNT }
    );
    const existingCardTransfer = seedTransfer(title, operatedAt, bridgeAccount.id, targetAccount.id, UAH_AMOUNT, consolidationType);

    return { bridgeAccount, bridgeIncome, existingCardTransfer, sourceAccount, sourceExpense, targetAccount };
};

const fetchMovedSourceIds = (canonicalId: number): number[] =>
    testDb
        .select()
        .from(TransactionEntryEntityTable)
        .where(eq(TransactionEntryEntityTable.transactionId, canonicalId))
        .all()
        .flatMap(entry => (entry.originalTransactionId ? [entry.originalTransactionId] : []));

const expectSingleIbanBridgeCanonical = (fromAccountId: number, toAccountId: number): number => {
    const canonicals = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);

    expect(canonicals).toHaveLength(1);
    expect(canonicals[0].fromAccountId).toBe(fromAccountId);
    expect(canonicals[0].toAccountId).toBe(toAccountId);

    return canonicals[0].id;
};

const expectParentedToCanonical = (canonicalId: number, transactionIds: readonly number[]): void => {
    transactionIds.forEach(transactionId => {
        expect(fetchTransactionById(transactionId).consolidationParentTransactionId).toBe(canonicalId);
    });
};

const expectMovedSourceIds = (canonicalId: number, transactionIds: readonly number[]): void => {
    expect(fetchMovedSourceIds(canonicalId).sort((left, right) => left - right)).toEqual(
        [...transactionIds].sort((left, right) => left - right)
    );
};

const expectExistingTransferBridgeConsolidated = async (
    candidate: ReturnType<typeof seedExistingTransferBridgeCandidate>
): Promise<number> => {
    const result = await transferConsolidationService.consolidate();

    expect(result).toEqual({ found: 1, consolidated: 1 });

    const canonicalId = expectSingleIbanBridgeCanonical(candidate.sourceAccount.id, candidate.targetAccount.id);
    expectParentedToCanonical(canonicalId, [candidate.sourceExpense.id, candidate.bridgeIncome.id, candidate.existingCardTransfer.id]);
    expectMovedSourceIds(canonicalId, [
        candidate.sourceExpense.id,
        candidate.bridgeIncome.id,
        candidate.existingCardTransfer.id,
        candidate.existingCardTransfer.id
    ]);

    return canonicalId;
};

describe('consolidation/historical-transfer-leftovers', () => {
    it('folds a past currency-exchange bridge leftover into the existing card transfer', async () => {
        const candidate = seedExistingTransferBridgeCandidate(
            'eur-to-uah',
            'На чорну картку',
            TransactionConsolidationTypeEnum.TRANSFER_PAIR
        );

        await expectExistingTransferBridgeConsolidated(candidate);
    });

    it('folds an existing card transfer that already owns same-currency sources', async () => {
        const candidate = seedExistingTransferBridgeCandidate(
            'canonical-bridge',
            'Canonical transfer',
            TransactionConsolidationTypeEnum.TRANSFER_PAIR
        );
        const movedSource = seedMovedSourceEntry(candidate.existingCardTransfer.id, candidate.bridgeAccount.id);

        await expectExistingTransferBridgeConsolidated(candidate);
        expect(fetchMovedSourceIds(candidate.existingCardTransfer.id)).toEqual([movedSource.id]);
    });

    it('does not fold a leaf source transaction that already owns moved source entries', async () => {
        const { existingCardTransfer, sourceAccount, sourceExpense, bridgeIncome } = seedExistingTransferBridgeCandidate(
            'canonical-source',
            'Canonical transfer',
            null
        );
        const movedSource = seedMovedSourceEntry(sourceExpense.id, sourceAccount.id);

        const result = await transferConsolidationService.consolidate();

        expect(result).toEqual({ found: 1, consolidated: 0 });
        expect(fetchTransactionById(sourceExpense.id).consolidationParentTransactionId).toBeNull();
        expect(fetchTransactionById(bridgeIncome.id).consolidationParentTransactionId).toBeNull();
        expect(fetchTransactionById(existingCardTransfer.id).consolidationParentTransactionId).toBeNull();
        expect(fetchMovedSourceIds(sourceExpense.id)).toEqual([movedSource.id]);
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
