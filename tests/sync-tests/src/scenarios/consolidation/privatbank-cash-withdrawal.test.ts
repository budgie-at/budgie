import { PrivatbankCategoryMatcherService } from '@app/sync/service/privatbank-category-matcher.service';
import { mapBankTransactionToCreateInput } from '@app/sync/util/map-bank-transaction-to-create-input.util';
import { TransactionImportService } from '@app/transaction/service/transaction-import.service';
import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { privatbankTransactionMapper } from '@budgie/sync';
import { afterEach, describe, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { expectAtmCashWithdrawalConsolidation, seed, TestLayer } from '../../harness';

const PRIVATBANK_CARD_ID = 'privat-card';
const PRIVATBANK_CASH_WITHDRAWAL_CATEGORY = 'Зняття готівки';
const WITHDRAWAL_AMOUNT = 500;
const WITHDRAWAL_OPERATED_AT = new Date('2026-01-15T12:00:00.000Z');

const importPrivatbankCashWithdrawal = Effect.fnUntraced(function* (privatbankAccountId: number) {
    const privatbankCategoryMatcherService = yield* PrivatbankCategoryMatcherService;
    const transactionImportService = yield* TransactionImportService;
    const categoryMap = yield* privatbankCategoryMatcherService.match([PRIVATBANK_CASH_WITHDRAWAL_CATEGORY]);
    const transaction = privatbankTransactionMapper({
        rawDate: '15.01.2026 12:00:00',
        date: WITHDRAWAL_OPERATED_AT,
        category: PRIVATBANK_CASH_WITHDRAWAL_CATEGORY,
        card: PRIVATBANK_CARD_ID,
        description: 'ATM cash withdrawal',
        cardAmount: -WITHDRAWAL_AMOUNT,
        cardCurrency: 'UAH',
        operationAmount: -WITHDRAWAL_AMOUNT,
        operationCurrency: 'UAH',
        endBalance: 0,
        balanceCurrency: 'UAH'
    });
    const mccCategoryLookup = categoryMap.get(PRIVATBANK_CASH_WITHDRAWAL_CATEGORY) ?? null;
    const input = mapBankTransactionToCreateInput(transaction, privatbankAccountId, mccCategoryLookup, ExternalSourceEnum.PRIVATBANK);
    const [imported] = yield* transactionImportService.bulkUpsertImported([input], new Map());

    return imported.id;
});

describe('consolidation/privatbank-cash-withdrawal', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it.effect('promotes an imported Privatbank cash withdrawal into a TRANSFER to the unique cash account', () =>
        Effect.gen(function* () {
            vi.useFakeTimers({ now: WITHDRAWAL_OPERATED_AT, toFake: ['Date'] });
            const privatbankAccount = yield* seed.account({
                title: 'Privatbank Card',
                externalId: PRIVATBANK_CARD_ID,
                externalSource: ExternalSourceEnum.PRIVATBANK,
                type: AccountTypeEnum.BANK_SYNC,
                instrumentId: 1
            });
            const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: 1 });
            const withdrawalTransactionId = yield* importPrivatbankCashWithdrawal(privatbankAccount.id);

            yield* expectAtmCashWithdrawalConsolidation(privatbankAccount.id, cashAccount.id, withdrawalTransactionId);
        }).pipe(Effect.provide(TestLayer))
    );
});
