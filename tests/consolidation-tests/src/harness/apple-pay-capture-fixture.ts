import {
    AccountTypeEnum,
    CategorySourceEnum,
    ExternalSourceEnum,
    MccCategoryEntityTable,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import {
    mapBankTransactionToCreateInput,
    mapBinanceWithdrawalToTransaction,
    mapErsteTransaction,
    privatbankTransactionMapper,
    SyncProviderEnum,
    SyncTransactionTypeEnum
} from '@budgie/sync';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { fetchMovedSourceIds, fetchOwnLedgerEntries } from './consolidation-revert-audit';
import { testDb, testQueryService, testSeedService } from './test-context';

import type { ApplePayBankExpenseInputInterface } from './interface/apple-pay-bank-expense-input.interface';
import type { ApplePayCaptureInputInterface } from './interface/apple-pay-capture-input.interface';
import type { MccCategoryLookupInterface, TransactionCreateInputInterface } from '@budgie/contracts';
import type { SyncTransactionInterface } from '@budgie/sync';

export const APPLE_PAY_CAPTURE_BASE_OPERATED_AT = new Date('2025-11-10T12:00:00Z');

export const APPLE_PAY_CAPTURE_MINUTE_MS = 60 * 1000;

export const APPLE_PAY_CAPTURE_HOUR_MS = 60 * APPLE_PAY_CAPTURE_MINUTE_MS;

export const APPLE_PAY_CAPTURE_DAY_MS = 24 * APPLE_PAY_CAPTURE_HOUR_MS;

export const APPLE_PAY_PURCHASE_AMOUNT = 100;

export const APPLE_PAY_NOTHING_MERGED = { found: 0, consolidated: 0 };

const UNIX_SECONDS_DIVISOR = 1000;
const ERSTE_IBAN = 'AT611904300234573201';
const PRIVATBANK_CARD = '4149 **** **** 1234';
const MONOBANK_UAH_CODE = 980;
const GROCERY_MCC = 5411;

export const addMilliseconds = (date: Date, milliseconds: number): Date => new Date(date.getTime() + milliseconds);

const buildMonobankLikeTransaction = (input: ApplePayBankExpenseInputInterface): SyncTransactionInterface => ({
    id: input.externalId,
    provider: SyncProviderEnum.MONOBANK,
    accountId: `account-${input.accountId}`,
    type: (input.isIncome ?? false) ? SyncTransactionTypeEnum.INCOME : SyncTransactionTypeEnum.EXPENSE,
    time: Math.floor(input.operatedAt.getTime() / UNIX_SECONDS_DIVISOR),
    description: 'Silpo',
    mcc: GROCERY_MCC,
    originalMcc: GROCERY_MCC,
    amount: input.amount,
    operationAmount: input.operationAmount ?? input.amount,
    currencyCode: MONOBANK_UAH_CODE,
    commissionRate: 0,
    cashbackAmount: 0,
    balance: 0,
    hold: false,
    feeAmount: input.feeAmount ?? 0
});

const buildBinanceWithdrawalTransaction = (input: ApplePayBankExpenseInputInterface): SyncTransactionInterface => {
    const transaction = mapBinanceWithdrawalToTransaction(
        {
            id: input.externalId,
            amount: String(input.amount),
            transactionFee: '0',
            coin: 'USDT',
            applyTime: input.operatedAt.toISOString()
        },
        `account-${input.accountId}`
    );

    if (!isDefined(transaction)) {
        throw new Error('Binance withdrawal fixture was not mapped');
    }

    return transaction;
};

const buildPrivatbankTransaction = (input: ApplePayBankExpenseInputInterface): SyncTransactionInterface => {
    const operationAmount = input.operationAmount ?? input.amount;

    return {
        ...privatbankTransactionMapper({
            rawDate: input.operatedAt.toISOString(),
            date: input.operatedAt,
            deviceLocalDate: input.operatedAt,
            category: 'Food',
            card: PRIVATBANK_CARD,
            description: `Silpo ${input.externalId}`,
            cardAmount: -input.amount,
            cardCurrency: 'UAH',
            operationAmount: -operationAmount,
            operationCurrency: isDefined(input.operationAmount) ? 'USD' : 'UAH',
            endBalance: 1000,
            balanceCurrency: 'UAH'
        }),
        id: input.externalId
    };
};

const buildErsteTransaction = (input: ApplePayBankExpenseInputInterface): SyncTransactionInterface => ({
    ...mapErsteTransaction(
        {
            date: input.operatedAt,
            reference: input.externalId,
            description: 'BILLA WIEN',
            amount: -input.amount,
            isCredit: false,
            city: 'Wien',
            countryAlpha2: 'AT'
        },
        ERSTE_IBAN
    ),
    id: input.externalId
});

const buildCsvTransaction = (input: ApplePayBankExpenseInputInterface): TransactionCreateInputInterface => ({
    type: TransactionTypeEnum.EXPENSE,
    operatedAt: input.operatedAt,
    exchangeRate: 1,
    amount: input.amount,
    externalId: input.externalId,
    title: '',
    updatedBy: null,
    externalSource: ExternalSourceEnum.CSV,
    comment: '',
    toAccountId: input.accountId,
    fromAccountId: null,
    tagIds: [],
    entries: [
        {
            type: TransactionEntryTypeEnum.CREDIT,
            amount: input.amount,
            accountId: input.accountId,
            categoryId: null,
            categorySource: CategorySourceEnum.USER,
            mccCategoryId: null,
            externalId: input.externalId
        }
    ]
});

const buildBankSyncTransaction = (input: ApplePayBankExpenseInputInterface): SyncTransactionInterface => {
    switch (input.source) {
        case ExternalSourceEnum.PRIVATBANK:
            return buildPrivatbankTransaction(input);
        case ExternalSourceEnum.ERSTE:
            return buildErsteTransaction(input);
        case ExternalSourceEnum.BINANCE:
            return buildBinanceWithdrawalTransaction(input);
        default:
            return buildMonobankLikeTransaction(input);
    }
};

const buildBankExpenseInput = (input: ApplePayBankExpenseInputInterface): TransactionCreateInputInterface =>
    input.source === ExternalSourceEnum.CSV
        ? buildCsvTransaction(input)
        : mapBankTransactionToCreateInput(buildBankSyncTransaction(input), input.accountId, input.mccCategoryLookup ?? null, input.source);

const buildApplePayCaptureInput = (input: ApplePayCaptureInputInterface): TransactionCreateInputInterface => {
    const exchangeRate = input.exchangeRate ?? 1;
    const entryAmounts = input.entryAmounts ?? [input.amount];

    return {
        amount: entryAmounts.reduce((total, entryAmount) => total + entryAmount, 0),
        title: input.merchant ?? 'Apple Pay purchase',
        comment: input.comment ?? '',
        type: TransactionTypeEnum.EXPENSE,
        exchangeRate,
        operatedAt: input.operatedAt,
        externalId: input.captureId,
        updatedBy: null,
        externalSource: ExternalSourceEnum.APPLE_PAY_AUTOMATION,
        fromAccountId: input.accountId,
        toAccountId: null,
        tagIds: [...(input.tagIds ?? [])],
        entries: entryAmounts.map((entryAmount, index) => ({
            accountId: input.accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: entryAmount,
            categoryId: input.categoryId ?? null,
            categorySource: CategorySourceEnum.USER,
            mccCategoryId: null,
            externalId: index === 0 ? input.captureId : `${input.captureId}:${index}`,
            exchangeRate,
            toIban: null
        }))
    };
};

export const seedApplePayCardAccount = (title: string, accountType: AccountTypeEnum = AccountTypeEnum.BANK_SYNC) =>
    testSeedService.account({ title, type: accountType, externalId: title });

export const seedBankExpense = Effect.fnUntraced(function* (input: ApplePayBankExpenseInputInterface) {
    const transactionService = yield* TransactionService;
    const [transaction] = yield* transactionService.bulkCreate([buildBankExpenseInput(input)]);

    return transaction;
});

export const seedApplePayCapture = Effect.fnUntraced(function* (input: ApplePayCaptureInputInterface) {
    const transactionService = yield* TransactionService;
    const [transaction] = yield* transactionService.bulkCreate([buildApplePayCaptureInput(input)]);

    return transaction;
});

export const seedMccDefaultCategory = Effect.fnUntraced(function* (categoryTitle: string) {
    const category = yield* testSeedService.category(categoryTitle);
    const mcc = yield* testQueryService.findMccByCode(String(GROCERY_MCC));

    yield* testDb.update(MccCategoryEntityTable).set({ defaultCategoryId: category.id }).where(eq(MccCategoryEntityTable.id, mcc.id));

    return { category, mccCategoryLookup: { id: mcc.id, defaultCategoryId: category.id } satisfies MccCategoryLookupInterface };
});

export const fetchPrimaryEntry = Effect.fnUntraced(function* (transactionId: number) {
    const [entry] = yield* fetchOwnLedgerEntries(transactionId);

    if (!isDefined(entry)) {
        throw new Error(`Ledger entry for transaction ${transactionId} not found`);
    }

    return entry;
});

export const expectCaptureMerged = (bankTransactionId: number, captureTransactionId: number) =>
    Effect.gen(function* () {
        const bank = yield* testQueryService.fetchTransactionById(bankTransactionId);
        const capture = yield* testQueryService.fetchTransactionById(captureTransactionId);

        expect(bank.consolidationType).toBe(TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE);
        expect(bank.consolidationParentTransactionId).toBeNull();
        expect(capture.consolidationParentTransactionId).toBe(bankTransactionId);
        expect(yield* fetchMovedSourceIds(bankTransactionId)).toEqual([captureTransactionId]);
        expect(yield* fetchOwnLedgerEntries(captureTransactionId)).toEqual([]);
    });

export const expectNotMerged = Effect.fnUntraced(function* (transactionIds: readonly number[]) {
    for (const transactionId of transactionIds) {
        const transaction = yield* testQueryService.fetchTransactionById(transactionId);

        expect(transaction).toMatchObject({ consolidationType: null, consolidationParentTransactionId: null });
        expect((yield* fetchOwnLedgerEntries(transactionId)).length).toBeGreaterThan(0);
    }
});
