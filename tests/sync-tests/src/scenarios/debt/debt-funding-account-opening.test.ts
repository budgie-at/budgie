import { accountBalanceRepository, exchangeRateRepository } from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { accountDebtOpeningService } from '@app/account/service/account-debt-opening.service';
import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    BORROWING_CATEGORY_ID,
    CategorySourceEnum,
    CurrencyEnum,
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    DebtEventSourceEnum,
    LENDING_CATEGORY_ID,
    PRECISION,
    TransactionEntryEntityTable,
    TransactionEntityTable,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { requireInstrument } from '../../harness';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { AccountEntityInterface } from '@budgie/contracts';

const OPENING_AMOUNT = 500;

const openDebt = async (debtType: AccountDebtTypeEnum, fundingAccount: AccountEntityInterface, instrumentId?: number) =>
    accountDebtOpeningService.openDebtWithFundingAccount(
        {
            title: debtType === AccountDebtTypeEnum.LENT ? 'Alex owes me' : 'I owe Alex',
            iban: null,
            icon: UserIconNameEnum.HandCoins,
            instrumentId: instrumentId ?? fundingAccount.instrumentId,
            type: AccountTypeEnum.DEBT,
            debtType,
            currentBalance: 0,
            targetBalance: OPENING_AMOUNT,
            contactId: null,
            deadline: null
        },
        fundingAccount.id
    );

const readEntries = (accountId: number) =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.accountId, accountId)).all();

const readDebtEvents = (debtAccountId: number) =>
    testDb.select().from(DebtEventEntityTable).where(eq(DebtEventEntityTable.debtAccountId, debtAccountId)).all();

const readBalance = (accountId: number) => accountBalanceRepository.getByAccountId(accountId).get()?.balance;

describe('opening a debt from a funding account', () => {
    it.each([
        [AccountDebtTypeEnum.LENT, TransactionTypeEnum.EXPENSE, LENDING_CATEGORY_ID, OPENING_AMOUNT * PRECISION],
        [AccountDebtTypeEnum.BORROW, TransactionTypeEnum.INCOME, BORROWING_CATEGORY_ID, -OPENING_AMOUNT * PRECISION]
    ])('books a single %s movement on the funding account', async (debtType, transactionType, categoryId, expectedDebtBalance) => {
        const fundingAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = await openDebt(debtType, fundingAccount);
        const [entry] = readEntries(fundingAccount.id);
        const transaction = testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.id, entry.transactionId)).get();
        const debtEvents = readDebtEvents(debtAccount.id);

        expect(readEntries(fundingAccount.id)).toHaveLength(1);
        expect(transaction?.type).toBe(transactionType);
        expect(entry.categoryId).toBe(categoryId);
        expect(entry.categorySource).toBe(CategorySourceEnum.DEBT_SETTLEMENT);
        expect(entry.amount).toBe(OPENING_AMOUNT * PRECISION);
        expect(readEntries(debtAccount.id)).toHaveLength(0);
        expect(debtEvents).toHaveLength(1);
        expect(debtEvents[0]).toMatchObject({
            direction: DebtEventDirectionEnum.OPEN,
            source: DebtEventSourceEnum.OPENING,
            amount: OPENING_AMOUNT * PRECISION,
            transactionEntryId: entry.id
        });
        expect(readBalance(debtAccount.id)).toBe(expectedDebtBalance);
        expect(readBalance(fundingAccount.id)).toBe(-expectedDebtBalance);
    });

    it('keeps the entered target in the debt instrument and converts only the funding entry', async () => {
        const usdInstrument = await requireInstrument(CurrencyEnum.USD);
        const eurInstrument = await requireInstrument(CurrencyEnum.EUR);
        await exchangeRateRepository.upsert(eurInstrument.id, usdInstrument.id, 2, 'test');

        const fundingAccount = seed.account({ title: 'Euro account', type: AccountTypeEnum.BANK_SYNC, instrumentId: eurInstrument.id });
        const debtAccount = await openDebt(AccountDebtTypeEnum.LENT, fundingAccount, usdInstrument.id);
        const [entry] = readEntries(fundingAccount.id);

        expect(entry.amount).toBe((OPENING_AMOUNT / 2) * PRECISION);
        expect(debtAccount.targetBalance).toBe(OPENING_AMOUNT * PRECISION);
        expect(readDebtEvents(debtAccount.id)[0].amount).toBe(OPENING_AMOUNT * PRECISION);
        expect(readBalance(debtAccount.id)).toBe(OPENING_AMOUNT * PRECISION);
        expect(readBalance(fundingAccount.id)).toBe(-(OPENING_AMOUNT / 2) * PRECISION);
    });

    it('recomputes the debt ledger balance from events when all balances are truncated', async () => {
        const fundingAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = await openDebt(AccountDebtTypeEnum.BORROW, fundingAccount);

        await accountBalanceIncrementalService.updateAllBalances(true);

        expect(readBalance(debtAccount.id)).toBe(-OPENING_AMOUNT * PRECISION);
    });
});
