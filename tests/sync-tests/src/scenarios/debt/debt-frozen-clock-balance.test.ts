import { AccountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import { AccountBalanceRepository, AccountDebtTypeEnum, AccountTypeEnum, PRECISION, UserIconNameEnum } from '@budgie/contracts';
import { afterEach, describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, TestLayer } from '../../harness';

const PRINCIPAL = 500;

describe('opening a funded debt under a frozen clock', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it.effect('books the principal once on the funding account and keeps net worth balanced', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const accountDebtOpeningService = yield* AccountDebtOpeningService;

            vi.useFakeTimers({ now: new Date('2026-01-15T12:00:00.000Z'), toFake: ['Date'] });
            const fundingAccount = yield* seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });

            for (const openedCount of [1, 2]) {
                yield* accountDebtOpeningService.openDebtWithFundingAccount(
                    {
                        title: `Alex owes me ${openedCount}`,
                        iban: null,
                        icon: UserIconNameEnum.HandCoins,
                        instrumentId: fundingAccount.instrumentId,
                        type: AccountTypeEnum.DEBT,
                        debtType: AccountDebtTypeEnum.LENT,
                        currentBalance: 0,
                        targetBalance: PRINCIPAL,
                        contactId: null,
                        deadline: null
                    },
                    fundingAccount.id
                );

                expect((yield* accountBalanceRepository.getByAccountId(fundingAccount.id)).at(0)?.balance).toBe(
                    -openedCount * PRINCIPAL * PRECISION
                );
                expect((yield* accountBalanceRepository.getNetWorth(fundingAccount.instrumentId)).at(0)?.netWorth).toBe(0);
            }
        }).pipe(Effect.provide(TestLayer))
    );
});
