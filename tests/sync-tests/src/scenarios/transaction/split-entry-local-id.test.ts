import { addLocalId, stripLocalId, withEntryAmount } from '@app/transaction/utils/entry-with-local-id.util';
import {
    AccountTypeEnum,
    CategorySourceEnum,
    CurrencyEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    convertFromMicroUnits,
    convertToMicroUnits
} from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, TestLayer, upsertCurrencyRate } from '../../harness';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

const OPERATED_AT = new Date('2026-06-02T12:00:00.000Z');

const fullEntry: TransactionEntryCreateInputInterface = {
    accountId: 1,
    categoryId: 2,
    categorySource: CategorySourceEnum.DEBT_SETTLEMENT,
    mccCategoryId: 3,
    type: TransactionEntryTypeEnum.CREDIT,
    kind: TransactionEntryKindEnum.PRIMARY,
    amount: 12.5,
    externalId: 'external-1',
    exchangeRate: 1.1,
    baseInstrumentId: 4,
    baseExchangeRate: 0.9,
    baseAmount: 11.25,
    quotedInstrumentId: 5,
    quotedAmount: 0.0002,
    quotedUnitPrice: 62_500,
    operationInstrumentId: 6,
    operationAmount: 13,
    toIban: 'UA00PRIVATBANK1234',
    originalTransactionId: 7
};

const buildSplitEntry = (accountId: number, amount: number): TransactionEntryCreateInputInterface => ({
    accountId,
    type: TransactionEntryTypeEnum.CREDIT,
    kind: TransactionEntryKindEnum.PRIMARY,
    amount,
    categoryId: null,
    mccCategoryId: null
});

describe('transaction/split-entry-local-id', () => {
    it.effect('keeps every entry field through the split modal local-id round trip', () =>
        Effect.sync(() => {
            expect(stripLocalId(addLocalId(fullEntry))).toStrictEqual(fullEntry);
        })
    );

    it.effect('revalues a split entry whose amount changed in the split modal', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const transactionRepository = yield* TransactionRepository;
            const { quoteInstrument: usdInstrument } = yield* upsertCurrencyRate(CurrencyEnum.EUR, CurrencyEnum.USD, 2);
            const account = yield* seed.account({ title: 'Dollar card', type: AccountTypeEnum.BANK_SYNC, instrumentId: usdInstrument.id });
            const transaction = yield* transactionService.createInternal({
                type: TransactionTypeEnum.EXPENSE,
                title: 'Split groceries',
                amount: 100,
                operatedAt: OPERATED_AT,
                comment: '',
                fromAccountId: account.id,
                toAccountId: null,
                exchangeRate: 1,
                externalId: null,
                externalSource: null,
                updatedBy: null,
                tagIds: [],
                entries: [buildSplitEntry(account.id, 30), buildSplitEntry(account.id, 70)]
            });
            const stored = yield* transactionRepository.getByIdWithEntries(transaction.id);
            const [firstEntry, secondEntry] = (stored?.entries ?? []).map(entry => ({ ...entry, amount: convertFromMicroUnits(entry.amount) }));

            yield* transactionService.updateById(transaction.id, {
                amount: 120,
                entries: [withEntryAmount(firstEntry, 50), withEntryAmount(secondEntry, 70)],
                tagIds: []
            });

            const updated = yield* transactionRepository.getByIdWithEntries(transaction.id);
            const updatedEntries = [...(updated?.entries ?? [])].sort((left, right) => left.amount - right.amount);

            expect(updatedEntries.map(entry => entry.baseAmount)).toEqual([
                Math.round(convertToMicroUnits(50) * (firstEntry.baseExchangeRate ?? 0)),
                secondEntry.baseAmount
            ]);
        }).pipe(Effect.provide(TestLayer))
    );
});
