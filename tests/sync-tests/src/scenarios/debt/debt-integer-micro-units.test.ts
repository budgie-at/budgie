import { AccountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import { TransferCreationService } from '@app/transaction/service/transfer-creation.service';
import { AccountDebtTypeEnum, AccountTypeEnum, CurrencyEnum, UserIconNameEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { buildTransferInput, seed, testDb, TestLayer, upsertCurrencyRate } from '../../harness';

const NON_TERMINATING_RATE = 3;
const OPERATED_AT = new Date('2026-06-02T12:00:00.000Z');

const countFractionalMicroUnitRows = Effect.map(
    testDb.$client.unsafe<{ count: number }>(
        `SELECT
                (SELECT count(*) FROM debt_events WHERE typeof(amount) = 'real' OR typeof(base_amount) = 'real')
                + (SELECT count(*) FROM transaction_entries WHERE typeof(amount) = 'real' OR typeof(base_amount) = 'real')
                + (SELECT count(*) FROM account_balances WHERE typeof(amount) = 'real') AS count`
    ),
    rows => rows[0]?.count
);

const arrange = Effect.gen(function* () {
    const { baseInstrument: eurInstrument, quoteInstrument: usdInstrument } = yield* upsertCurrencyRate(
        CurrencyEnum.EUR,
        CurrencyEnum.USD,
        NON_TERMINATING_RATE
    );

    return {
        usdAccount: yield* seed.account({ title: 'Dollar card', type: AccountTypeEnum.BANK_SYNC, instrumentId: usdInstrument.id }),
        eurAccount: yield* seed.account({ title: 'Euro card', type: AccountTypeEnum.BANK_SYNC, instrumentId: eurInstrument.id })
    };
});

describe('cross-instrument money legs at a non-terminating rate', () => {
    it.effect('opens a debt funded from another instrument with integer micro-units', () =>
        Effect.gen(function* () {
            const accountDebtOpeningService = yield* AccountDebtOpeningService;
            const { usdAccount, eurAccount } = yield* arrange;

            yield* accountDebtOpeningService.openDebtWithFundingAccount(
                {
                    title: 'Alex owes me',
                    iban: null,
                    icon: UserIconNameEnum.HandCoins,
                    instrumentId: usdAccount.instrumentId,
                    type: AccountTypeEnum.DEBT,
                    debtType: AccountDebtTypeEnum.LENT,
                    currentBalance: 0,
                    targetBalance: 100,
                    contactId: null,
                    deadline: null
                },
                eurAccount.id
            );

            expect(yield* countFractionalMicroUnitRows).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([1, NON_TERMINATING_RATE])(
        'transfers into another instrument with integer micro-units at exchange rate %s',
        exchangeRate =>
            Effect.gen(function* () {
                const transferCreationService = yield* TransferCreationService;
                const { usdAccount, eurAccount } = yield* arrange;

                yield* transferCreationService.createInternalTransfer({
                    ...buildTransferInput(usdAccount.id, eurAccount.id, 100, OPERATED_AT),
                    exchangeRate
                });

                expect(yield* countFractionalMicroUnitRows).toBe(0);
            }).pipe(Effect.provide(TestLayer))
    );
});
