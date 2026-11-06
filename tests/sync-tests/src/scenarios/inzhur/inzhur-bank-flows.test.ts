import {
    INVESTMENTS_CATEGORY_ID,
    PRECISION,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { INZHUR_UNATTRIBUTED_DIVIDEND_TITLE } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, testQueryService } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { consolidateInzhur } from '../../harness/inzhur/consolidate-inzhur';
import { fetchBankTransactions } from '../../harness/inzhur/fetch-bank-transactions';
import { importInzhurBankFlow } from '../../harness/inzhur/import-inzhur-bank-flow';
import { importInzhurBankTransaction } from '../../harness/inzhur/import-inzhur-bank-transaction';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import {
    REIT_DIVIDEND_DESCRIPTION,
    TOP_UP_DESCRIPTION,
    UNNAMED_DIVIDEND_DESCRIPTION
} from '../../harness/inzhur/inzhur-bank-descriptions.constant';
import { REIT_ISIN } from '../../harness/inzhur/inzhur-fund-isins.constant';
import { BASE_ROWS } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurFundAccount } from '../../harness/inzhur/require-inzhur-fund-account';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';

const URI = 'base.xlsx';
const OPERATED_AT = new Date('2026-06-01T08:00:00.000Z');
const MONEY_TRANSFER_MCC = '4829';

const layer = makeInzhurOperationsLayer({ [URI]: buildInzhurOperationsWorkbook(BASE_ROWS) });

const prepare = Effect.gen(function* () {
    yield* importInzhurOperations(URI);

    const { cashAccount } = yield* requireInzhurSetup();

    return {
        bankAccount: yield* seedInzhurBankAccount,
        cashAccount,
        reitAccount: yield* requireInzhurFundAccount(REIT_ISIN)
    };
});

const fetchSingleBankTransaction = Effect.fnUntraced(function* () {
    const [transaction, ...rest] = yield* fetchBankTransactions();

    expect(rest).toEqual([]);

    return transaction;
});

describe('inzhur/bank-flows', () => {
    it.effect('turns a card payment to Inzhur into a transfer into the cash account', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount } = yield* prepare;

            yield* importInzhurBankFlow(bankAccount.id, 'top-up', TOP_UP_DESCRIPTION, -1000, OPERATED_AT);

            expect(yield* fetchSingleBankTransaction()).toMatchObject({
                type: TransactionTypeEnum.TRANSFER,
                title: 'Top-up to Inzhur',
                fromAccountId: bankAccount.id,
                toAccountId: cashAccount.id,
                entries: [
                    { accountId: bankAccount.id, type: TransactionEntryTypeEnum.CREDIT, amount: 1000 * PRECISION },
                    { accountId: cashAccount.id, type: TransactionEntryTypeEnum.DEBIT, amount: 1000 * PRECISION }
                ]
            });
            expect(yield* fetchAccountBalance(bankAccount.id)).toBe(-1000 * PRECISION);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(1200 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('links a dividend naming the fund to it as investments income', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount, reitAccount } = yield* prepare;

            yield* importInzhurBankFlow(bankAccount.id, 'dividend', REIT_DIVIDEND_DESCRIPTION, 120, OPERATED_AT);

            expect(yield* fetchSingleBankTransaction()).toMatchObject({
                type: TransactionTypeEnum.INCOME,
                title: 'REIT dividends',
                comment: REIT_DIVIDEND_DESCRIPTION,
                fundAccountId: reitAccount.id,
                entries: [{ accountId: bankAccount.id, amount: 120 * PRECISION, categoryId: INVESTMENTS_CATEGORY_ID }]
            });
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(200 * PRECISION);
            expect(yield* fetchAccountBalance(bankAccount.id)).toBe(120 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('links a dividend naming the fund by its ISIN', () =>
        Effect.gen(function* () {
            const { bankAccount, reitAccount } = yield* prepare;

            yield* importInzhurBankFlow(bankAccount.id, 'dividend', `${UNNAMED_DIVIDEND_DESCRIPTION} ${REIT_ISIN}`, 80, OPERATED_AT);

            expect(yield* fetchSingleBankTransaction()).toMatchObject({ title: 'REIT dividends', fundAccountId: reitAccount.id });
        }).pipe(Effect.provide(layer))
    );

    it.effect('records an unattributed investment income when no fund is named', () =>
        Effect.gen(function* () {
            const { bankAccount } = yield* prepare;

            yield* importInzhurBankFlow(bankAccount.id, 'dividend', UNNAMED_DIVIDEND_DESCRIPTION, 80, OPERATED_AT);

            expect(yield* fetchSingleBankTransaction()).toMatchObject({
                type: TransactionTypeEnum.INCOME,
                title: INZHUR_UNATTRIBUTED_DIVIDEND_TITLE,
                comment: UNNAMED_DIVIDEND_DESCRIPTION,
                fundAccountId: null,
                entries: [{ categoryId: INVESTMENTS_CATEGORY_ID }]
            });
        }).pipe(Effect.provide(layer))
    );

    it.effect('titles a dividend again when a resync restores the bank description, but keeps a title the user set', () =>
        Effect.gen(function* () {
            const { bankAccount } = yield* prepare;
            const transactionRepository = yield* TransactionRepository;

            yield* importInzhurBankFlow(bankAccount.id, 'dividend', REIT_DIVIDEND_DESCRIPTION, 80, OPERATED_AT);

            const dividend = yield* fetchSingleBankTransaction();

            yield* transactionRepository.updateById(dividend.id, { title: REIT_DIVIDEND_DESCRIPTION });
            yield* consolidateInzhur;
            expect(yield* fetchSingleBankTransaction()).toMatchObject({ title: 'REIT dividends', comment: REIT_DIVIDEND_DESCRIPTION });

            yield* transactionRepository.updateById(dividend.id, { title: 'Quarterly payout', updatedBy: TransactionUpdatedByEnum.USER });
            yield* consolidateInzhur;
            expect(yield* fetchSingleBankTransaction()).toMatchObject({ title: 'Quarterly payout', comment: REIT_DIVIDEND_DESCRIPTION });
        }).pipe(Effect.provide(layer))
    );

    it.effect('turns a non-dividend payment from Inzhur into a withdrawal from the cash account', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount } = yield* prepare;

            yield* importInzhurBankFlow(bankAccount.id, 'withdrawal', 'Переказ від ТОВ "ІНЖУР КЕПІТАЛ"', 150, OPERATED_AT);

            expect(yield* fetchSingleBankTransaction()).toMatchObject({
                type: TransactionTypeEnum.TRANSFER,
                title: 'Withdrawal from Inzhur',
                fromAccountId: cashAccount.id,
                toAccountId: bankAccount.id,
                entries: [
                    { accountId: cashAccount.id, type: TransactionEntryTypeEnum.CREDIT, amount: 150 * PRECISION },
                    { accountId: bankAccount.id, type: TransactionEntryTypeEnum.DEBIT, amount: 150 * PRECISION }
                ]
            });
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(50 * PRECISION);
            expect(yield* fetchAccountBalance(bankAccount.id)).toBe(150 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('turns a real-shaped money transfer top-up without an IBAN into a transfer into the cash account', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount } = yield* prepare;
            const transferMcc = yield* testQueryService.findMccByCode(MONEY_TRANSFER_MCC);

            yield* importInzhurBankTransaction(bankAccount.id, 'real-shaped', TOP_UP_DESCRIPTION, -1000, OPERATED_AT, {
                mccCategoryId: transferMcc.id
            });
            yield* consolidateInzhur;

            expect(yield* fetchBankTransactions()).toMatchObject([
                { externalId: 'real-shaped', type: TransactionTypeEnum.TRANSFER, toAccountId: cashAccount.id }
            ]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(1200 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('leaves a person-to-person transfer from someone whose name contains Inzhur untouched', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount } = yield* prepare;
            const transferMcc = yield* testQueryService.findMccByCode(MONEY_TRANSFER_MCC);

            yield* importInzhurBankTransaction(bankAccount.id, 'p2p', 'Іван Інжур', -300, OPERATED_AT, { mccCategoryId: transferMcc.id });
            yield* consolidateInzhur;

            expect(yield* fetchBankTransactions()).toMatchObject([{ externalId: 'p2p', type: TransactionTypeEnum.EXPENSE }]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(200 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('leaves Inzhur-looking bank transactions untouched when Inzhur is not set up', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedInzhurBankAccount;

            yield* importInzhurBankTransaction(bankAccount.id, 'top-up', TOP_UP_DESCRIPTION, -1000, OPERATED_AT);
            yield* importInzhurBankTransaction(bankAccount.id, 'dividend', UNNAMED_DIVIDEND_DESCRIPTION, 80, OPERATED_AT);
            yield* consolidateInzhur;

            expect(yield* fetchBankTransactions()).toMatchObject([
                { type: TransactionTypeEnum.EXPENSE, entries: [{ categoryId: null }] },
                { type: TransactionTypeEnum.INCOME, title: UNNAMED_DIVIDEND_DESCRIPTION, entries: [{ categoryId: null }] }
            ]);
            expect(yield* fetchAccountBalance(bankAccount.id)).toBe(-920 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('stays unchanged when the same bank transactions are synced and consolidated again', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount } = yield* prepare;

            const importBoth = Effect.gen(function* () {
                yield* importInzhurBankTransaction(bankAccount.id, 'top-up', TOP_UP_DESCRIPTION, -1000, OPERATED_AT);
                yield* importInzhurBankTransaction(bankAccount.id, 'dividend', REIT_DIVIDEND_DESCRIPTION, 80, OPERATED_AT);
                yield* consolidateInzhur;
            });

            yield* importBoth;

            const firstPass = yield* fetchBankTransactions();

            yield* importBoth;
            yield* consolidateInzhur;

            expect(firstPass).toHaveLength(2);
            expect(yield* fetchBankTransactions()).toEqual(firstPass);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(1200 * PRECISION);
            expect(yield* fetchAccountBalance(bankAccount.id)).toBe(-920 * PRECISION);
        }).pipe(Effect.provide(layer))
    );
});
