import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { accountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import { AccountDebtTypeEnum, AccountTypeEnum, PRECISION, UserIconNameEnum } from '@budgie/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { seed } from '../../harness';

const PRINCIPAL = 500;

describe('opening a funded debt under a frozen clock', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('books the principal once on the funding account and keeps net worth balanced', async () => {
        vi.useFakeTimers({ now: new Date('2026-01-15T12:00:00.000Z') });
        const fundingAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });

        for (const openedCount of [1, 2]) {
            await accountDebtOpeningService.openDebtWithFundingAccount(
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

            expect(accountBalanceRepository.getByAccountId(fundingAccount.id).get()?.balance).toBe(-openedCount * PRINCIPAL * PRECISION);
            expect(accountBalanceRepository.getNetWorth(fundingAccount.instrumentId).get()?.netWorth).toBe(0);
        }
    });
});
