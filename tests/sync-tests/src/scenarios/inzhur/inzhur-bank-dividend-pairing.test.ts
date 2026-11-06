import { PRECISION, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { consolidateInzhur } from '../../harness/inzhur/consolidate-inzhur';
import { fetchBankTransactions } from '../../harness/inzhur/fetch-bank-transactions';
import { fetchInzhurOperationsLedger } from '../../harness/inzhur/fetch-inzhur-operations-ledger';
import { importInzhurBankFlow } from '../../harness/inzhur/import-inzhur-bank-flow';
import { importInzhurBankTransaction } from '../../harness/inzhur/import-inzhur-bank-transaction';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import {
    REIT_DIVIDEND_DESCRIPTION,
    WITHDRAWAL_COMMENT,
    WITHDRAWAL_DESCRIPTION
} from '../../harness/inzhur/inzhur-bank-descriptions.constant';
import { REIT_ISIN } from '../../harness/inzhur/inzhur-fund-isins.constant';
import { BASE_ROWS, WITHDRAWAL_TYPE } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurFundAccount } from '../../harness/inzhur/require-inzhur-fund-account';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';

const BASE_URI = 'base.xlsx';
const WITHDRAWAL_URI = 'withdrawal.xlsx';
const DIVIDEND_AT = new Date('2026-02-02T08:00:00.000Z');

const layer = makeInzhurOperationsLayer({
    [BASE_URI]: buildInzhurOperationsWorkbook(BASE_ROWS),
    [WITHDRAWAL_URI]: buildInzhurOperationsWorkbook([...BASE_ROWS, { at: '2026-02-01T10:00:00', type: WITHDRAWAL_TYPE, credit: 120 }])
});

const expectPaidOutAsTransfer = Effect.fnUntraced(function* (bankAccountId: number, cashAccountId: number) {
    expect(yield* fetchBankTransactions()).toMatchObject([
        { type: TransactionTypeEnum.TRANSFER, fromAccountId: cashAccountId, toAccountId: bankAccountId, fundAccountId: null }
    ]);
    expect((yield* fetchInzhurOperationsLedger).filter(({ title }) => title === 'Withdrawal from Inzhur')).toEqual([]);
    expect(yield* fetchAccountBalance(cashAccountId)).toBe(80 * PRECISION);
    expect(yield* fetchAccountBalance(bankAccountId)).toBe(120 * PRECISION);
});

describe('inzhur/bank-dividend-pairing', () => {
    it.effect('pairs a bank dividend imported after the export with its withdrawal row into a transfer', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedInzhurBankAccount;

            yield* importInzhurOperations(WITHDRAWAL_URI);
            yield* importInzhurBankFlow(bankAccount.id, 'dividend', REIT_DIVIDEND_DESCRIPTION, 120, DIVIDEND_AT);

            yield* expectPaidOutAsTransfer(bankAccount.id, (yield* requireInzhurSetup()).cashAccount.id);
        }).pipe(Effect.provide(layer))
    );

    it.effect('converts a bank dividend recorded before the export into that transfer and clears its fund link', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedInzhurBankAccount;

            yield* importInzhurOperations(BASE_URI);
            yield* importInzhurBankFlow(bankAccount.id, 'dividend', REIT_DIVIDEND_DESCRIPTION, 120, DIVIDEND_AT);

            const reitAccount = yield* requireInzhurFundAccount(REIT_ISIN);

            expect(yield* fetchBankTransactions()).toMatchObject([{ type: TransactionTypeEnum.INCOME, fundAccountId: reitAccount.id }]);

            const summary = yield* importInzhurOperations(WITHDRAWAL_URI);

            expect(summary.bankMatches).toEqual({ paired: 1, unpaired: 1 });
            yield* expectPaidOutAsTransfer(bankAccount.id, (yield* requireInzhurSetup()).cashAccount.id);
        }).pipe(Effect.provide(layer))
    );

    it.effect('lets a genuine bank withdrawal win the pairing over a same-amount dividend regardless of order', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedInzhurBankAccount;

            yield* importInzhurOperations(WITHDRAWAL_URI);
            yield* importInzhurBankTransaction(
                bankAccount.id,
                'dividend',
                REIT_DIVIDEND_DESCRIPTION,
                120,
                new Date('2026-02-01T08:10:00.000Z')
            );
            yield* importInzhurBankTransaction(
                bankAccount.id,
                'withdrawal',
                WITHDRAWAL_DESCRIPTION,
                120,
                new Date('2026-02-01T08:30:00.000Z'),
                {
                    comment: WITHDRAWAL_COMMENT
                }
            );
            yield* consolidateInzhur;

            const byExternalId = new Map((yield* fetchBankTransactions()).map(transaction => [transaction.externalId, transaction]));

            expect(byExternalId.get('withdrawal')).toMatchObject({ type: TransactionTypeEnum.TRANSFER });
            expect(byExternalId.get('dividend')).toMatchObject({ type: TransactionTypeEnum.INCOME });
            expect((yield* fetchInzhurOperationsLedger).filter(({ title }) => title === 'Withdrawal from Inzhur')).toEqual([]);
            expect(yield* fetchAccountBalance((yield* requireInzhurSetup()).cashAccount.id)).toBe(80 * PRECISION);
        }).pipe(Effect.provide(layer))
    );
});
