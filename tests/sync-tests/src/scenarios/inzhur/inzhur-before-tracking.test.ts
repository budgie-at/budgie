import { AccountTypeEnum, ExternalSourceEnum, PRECISION, TransactionTypeEnum } from '@budgie/contracts';
import { InzhurSetupService, TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, seed } from '../../harness';
import { fetchBankTransactions } from '../../harness/inzhur/fetch-bank-transactions';
import { fetchSourceLedger } from '../../harness/inzhur/fetch-source-ledger';
import { importInzhurBankTransaction } from '../../harness/inzhur/import-inzhur-bank-transaction';
import { INZHUR_BEFORE_TRACKING_EXTERNAL_ID } from '../../harness/inzhur/inzhur-before-tracking-external-id.constant';
import { makeInzhurLayer } from '../../harness/inzhur/make-inzhur-layer';

const UAH_INSTRUMENT_ID = 1;
const MILLISECONDS_PER_DAY = 86_400_000;
const PAST_AT = new Date(Date.now() - 30 * MILLISECONDS_PER_DAY);
const EARLIER_PAST_AT = new Date(Date.now() - 60 * MILLISECONDS_PER_DAY);
const FUTURE_AT = new Date(Date.now() + MILLISECONDS_PER_DAY);
const TOP_UP_DESCRIPTION = 'ТОВ "Інжур Кепітал"';
const WITHDRAWAL_DESCRIPTION = 'ТОВ "ІНЖУР КЕПІТАЛ"';
const WITHDRAWAL_COMMENT = 'Повернення коштів з брокерського рахунку № IN-0000';
const IBAN_DESCRIPTION = 'Платіж за IBAN';
const COMPANY_IBAN = 'UA553071230000026504020119504';
const OTHER_IBAN = 'UA213223130000026007233566001';
const DIVIDEND_DESCRIPTION = 'ТОВ ІНЖУР КЕПІТАЛ виплата доходу';

const layer = makeInzhurLayer({});

const consolidate = Effect.flatMap(TransferConsolidationService, service => service.consolidate(null));

const setUp = (enteredCash: number) => Effect.flatMap(InzhurSetupService, service => service.setup(enteredCash));

const seedBankAccount = seed.account({
    title: 'Monobank Card',
    externalId: 'inzhur-test-card',
    externalSource: ExternalSourceEnum.MONOBANK,
    type: AccountTypeEnum.BANK_SYNC,
    instrumentId: UAH_INSTRUMENT_ID
});

const importHistory = Effect.fnUntraced(function* (bankAccountId: number) {
    yield* importInzhurBankTransaction(bankAccountId, 'top-up-1', TOP_UP_DESCRIPTION, -1000, EARLIER_PAST_AT);
    yield* importInzhurBankTransaction(bankAccountId, 'top-up-2', IBAN_DESCRIPTION, -500, PAST_AT, { counterIban: COMPANY_IBAN });
    yield* importInzhurBankTransaction(bankAccountId, 'withdrawal', WITHDRAWAL_DESCRIPTION, 300, PAST_AT, {
        comment: WITHDRAWAL_COMMENT
    });
    yield* importInzhurBankTransaction(bankAccountId, 'dividend', DIVIDEND_DESCRIPTION, 120, PAST_AT);
});

const setUpAfterTopUp = Effect.fnUntraced(function* (enteredCash: number) {
    const bankAccount = yield* seedBankAccount;

    yield* importInzhurBankTransaction(bankAccount.id, 'top-up-1', TOP_UP_DESCRIPTION, -1000, PAST_AT);
    const { cashAccount } = yield* setUp(enteredCash);

    return { bankAccount, cashAccount };
});

const fetchCorrections = Effect.gen(function* () {
    const ledger = yield* fetchSourceLedger(ExternalSourceEnum.INZHUR);

    return ledger.filter(transaction => transaction.externalId === INZHUR_BEFORE_TRACKING_EXTERNAL_ID);
});

describe('inzhur/before-tracking', () => {
    it.effect('links past payments and books a negative correction so cash equals the entered amount', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedBankAccount;

            yield* importHistory(bankAccount.id);
            const { cashAccount, linked } = yield* setUp(500);

            expect(linked).toEqual({ topUps: 2, withdrawals: 1, dividends: 1 });
            expect(yield* fetchBankTransactions()).toMatchObject([
                { externalId: 'top-up-1', type: TransactionTypeEnum.TRANSFER, title: 'Top-up to Inzhur', toAccountId: cashAccount.id },
                { externalId: 'top-up-2', type: TransactionTypeEnum.TRANSFER, title: 'Top-up to Inzhur', toAccountId: cashAccount.id },
                {
                    externalId: 'withdrawal',
                    type: TransactionTypeEnum.TRANSFER,
                    title: 'Withdrawal from Inzhur',
                    fromAccountId: cashAccount.id
                },
                { externalId: 'dividend', type: TransactionTypeEnum.INCOME, title: 'Inzhur dividends' }
            ]);
            expect(yield* fetchCorrections).toMatchObject([
                { type: TransactionTypeEnum.ADJUSTMENT, title: 'Invested before tracking', entries: [{ amount: 700 * PRECISION }] }
            ]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(500 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('books a positive correction titled as a balance when cash entered exceeds the linked flows', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedBankAccount;

            yield* importHistory(bankAccount.id);
            const { cashAccount } = yield* setUp(2000);

            expect(yield* fetchCorrections).toMatchObject([
                { type: TransactionTypeEnum.ADJUSTMENT, title: 'Balance before tracking', entries: [{ amount: 800 * PRECISION }] }
            ]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(2000 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('books no correction when the linked flows already equal the entered cash', () =>
        Effect.gen(function* () {
            const { cashAccount } = yield* setUpAfterTopUp(1000);

            expect(yield* fetchCorrections).toEqual([]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(1000 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('keeps cash unchanged and recomputes the correction when an older top-up arrives after setup', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount } = yield* setUpAfterTopUp(500);

            yield* importInzhurBankTransaction(bankAccount.id, 'late-top-up', TOP_UP_DESCRIPTION, -300, EARLIER_PAST_AT);
            yield* consolidate;

            expect(yield* fetchBankTransactions()).toMatchObject([
                { externalId: 'top-up-1', type: TransactionTypeEnum.TRANSFER },
                { externalId: 'late-top-up', type: TransactionTypeEnum.TRANSFER }
            ]);
            expect(yield* fetchCorrections).toMatchObject([{ title: 'Invested before tracking', entries: [{ amount: 800 * PRECISION }] }]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(500 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('removes the correction when a late pre-setup flow brings the history in line with the entered cash', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedBankAccount;

            const { cashAccount } = yield* setUp(300);

            yield* importInzhurBankTransaction(bankAccount.id, 'late-top-up', TOP_UP_DESCRIPTION, -300, PAST_AT);
            yield* consolidate;

            expect(yield* fetchCorrections).toEqual([]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(300 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('raises cash by a top-up made after setup', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount } = yield* setUpAfterTopUp(500);

            yield* importInzhurBankTransaction(bankAccount.id, 'new-top-up', TOP_UP_DESCRIPTION, -400, FUTURE_AT);
            yield* consolidate;

            expect(yield* fetchCorrections).toMatchObject([{ entries: [{ amount: 500 * PRECISION }] }]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(900 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('matches a top-up by the company IBAN alone and ignores another recipient IBAN', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedBankAccount;
            const { cashAccount } = yield* setUp(0);

            yield* importInzhurBankTransaction(bankAccount.id, 'iban-top-up', IBAN_DESCRIPTION, -250, FUTURE_AT, {
                counterIban: COMPANY_IBAN
            });
            yield* importInzhurBankTransaction(bankAccount.id, 'other-iban', IBAN_DESCRIPTION, -75, FUTURE_AT, { counterIban: OTHER_IBAN });
            yield* consolidate;

            expect(yield* fetchBankTransactions()).toMatchObject([
                { externalId: 'iban-top-up', type: TransactionTypeEnum.TRANSFER, toAccountId: cashAccount.id },
                { externalId: 'other-iban', type: TransactionTypeEnum.EXPENSE }
            ]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(250 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('leaves a person named Inzhur untouched in the history', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedBankAccount;

            yield* importInzhurBankTransaction(bankAccount.id, 'p2p', 'Іван Інжур', -300, PAST_AT);
            const { cashAccount, linked } = yield* setUp(100);

            expect(linked).toEqual({ topUps: 0, withdrawals: 0, dividends: 0 });
            expect(yield* fetchBankTransactions()).toMatchObject([{ externalId: 'p2p', type: TransactionTypeEnum.EXPENSE }]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(100 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('stays unchanged when setup runs twice and the bank is resynced', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedBankAccount;

            yield* importHistory(bankAccount.id);
            const { cashAccount } = yield* setUp(500);
            const firstBank = yield* fetchBankTransactions();
            const firstCorrections = yield* fetchCorrections;

            const second = yield* setUp(9999);

            yield* importHistory(bankAccount.id);
            yield* consolidate;
            yield* consolidate;

            expect(second.linked).toEqual({ topUps: 0, withdrawals: 0, dividends: 0 });
            expect(yield* fetchBankTransactions()).toEqual(firstBank);
            expect(yield* fetchCorrections).toEqual(firstCorrections);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(500 * PRECISION);
        }).pipe(Effect.provide(layer))
    );
});
