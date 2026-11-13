import { AccountBalanceRepository, AccountDebtTypeEnum, AccountTypeEnum, UserIconNameEnum, convertToMicroUnits } from '@budgie/contracts';
import { AccountDebtOpeningService, AccountService } from '@budgie/ledger';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { DEBT_OPENING_MESSAGES, TestLayer, requireInstrument } from '../../harness';

it.effect('lending £400 from £900 cash leaves £500 on Home', () =>
    Effect.gen(function* () {
        const pound = yield* requireInstrument('GBP');
        const accountService = yield* AccountService;
        const debtOpeningService = yield* AccountDebtOpeningService;
        const balances = yield* AccountBalanceRepository;
        const funding = yield* accountService.create({
            title: 'E2E Lent Funding',
            type: AccountTypeEnum.CASH,
            instrumentId: pound.id,
            icon: UserIconNameEnum.HandCoins,
            currentBalance: 900
        });
        const debt = yield* debtOpeningService.openDebtWithFundingAccount(
            {
                title: 'E2E Lent From Cash',
                type: AccountTypeEnum.DEBT,
                debtType: AccountDebtTypeEnum.LENT,
                instrumentId: pound.id,
                icon: UserIconNameEnum.HandCoins,
                currentBalance: 0,
                targetBalance: 400,
                iban: null,
                contactId: null,
                deadline: null
            },
            funding.id,
            DEBT_OPENING_MESSAGES
        );
        const rows = yield* balances.getHomeAccountRows(pound.id);

        expect(rows.find(row => row.account.id === funding.id)?.balance).toBe(convertToMicroUnits(500));
        expect(rows.find(row => row.account.id === debt.id)?.account.debtType).toBe(AccountDebtTypeEnum.LENT);
        expect(rows.find(row => row.account.id === debt.id)?.debtOutstandingAmount).toBe(convertToMicroUnits(400));
    }).pipe(Effect.provide(TestLayer))
);
