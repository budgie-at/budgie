import { exchangeRateRepository } from '@app/@generic/drizzle/db/db';
import { accountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import { transactionService } from '@app/transaction/service/transaction.service';
import { AccountDebtTypeEnum, AccountTypeEnum, CurrencyEnum, UserIconNameEnum } from '@budgie/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildTransferInput, requireInstrument, seed, testDb } from '../../harness';

import type { AccountEntityInterface } from '@budgie/contracts';

const NON_TERMINATING_RATE = 3;
const OPERATED_AT = new Date('2026-06-02T12:00:00.000Z');

const countFractionalMicroUnitRows = async (): Promise<number | undefined> =>
    (
        await testDb.$client.getFirstAsync<{ count: number }>(
            `SELECT
                (SELECT count(*) FROM debt_events WHERE typeof(amount) = 'real' OR typeof(base_amount) = 'real')
                + (SELECT count(*) FROM transaction_entries WHERE typeof(amount) = 'real' OR typeof(base_amount) = 'real')
                + (SELECT count(*) FROM account_balances WHERE typeof(amount) = 'real') AS count`
        )
    )?.count;

describe('cross-instrument money legs at a non-terminating rate', () => {
    let usdAccount: AccountEntityInterface;
    let eurAccount: AccountEntityInterface;

    beforeEach(async () => {
        const usdInstrument = await requireInstrument(CurrencyEnum.USD);
        const eurInstrument = await requireInstrument(CurrencyEnum.EUR);

        await exchangeRateRepository.upsert(eurInstrument.id, usdInstrument.id, NON_TERMINATING_RATE, 'test');
        usdAccount = seed.account({ title: 'Dollar card', type: AccountTypeEnum.BANK_SYNC, instrumentId: usdInstrument.id });
        eurAccount = seed.account({ title: 'Euro card', type: AccountTypeEnum.BANK_SYNC, instrumentId: eurInstrument.id });
    });

    it('opens a debt funded from another instrument with integer micro-units', async () => {
        await accountDebtOpeningService.openDebtWithFundingAccount(
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

        expect(await countFractionalMicroUnitRows()).toBe(0);
    });

    it.each([1, NON_TERMINATING_RATE])(
        'transfers into another instrument with integer micro-units at exchange rate %s',
        async exchangeRate => {
            await transactionService.createInternalTransfer({
                ...buildTransferInput(usdAccount.id, eurAccount.id, 100, OPERATED_AT),
                exchangeRate
            });

            expect(await countFractionalMicroUnitRows()).toBe(0);
        }
    );
});
