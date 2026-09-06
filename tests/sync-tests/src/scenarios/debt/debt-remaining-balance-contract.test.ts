import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { accountBalanceRepository, exchangeRateRepository } from '@app/@generic/drizzle/db/db';
import { convertFromMicroUnits } from '@app/@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '@app/@generic/utils/convert-to-micro-units.util';
import { buildTestDb, createTestRepositories } from '@budgie-at/test-kit';
import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    CurrencyEnum,
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    DebtEventSourceEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { requireInstrument } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import { LegacyDebtContractFixture } from './legacy-debt-contract-fixture';

import type { AccountEntityInterface, DebtEventEntityInterface } from '@budgie/contracts';

const OPERATED_AT = new Date('2026-06-02T12:00:00.000Z');
const scenarioDirectory = resolve(fileURLToPath(import.meta.url), '..');
const preMigrationFixturePath = resolve(scenarioDirectory, '../../../fixtures/debt-migration/pre-0033.db');

const seedDebtAccount = (debtType: AccountDebtTypeEnum, targetBalance: number, instrumentId = 1): AccountEntityInterface =>
    seed.account({ title: 'Debt contract account', type: AccountTypeEnum.DEBT, debtType, targetBalance, instrumentId });

const insertDebtEvent = (debtAccountId: number, direction: DebtEventDirectionEnum, amount: number): DebtEventEntityInterface =>
    insertOne(DebtEventEntityTable, {
        debtAccountId,
        direction,
        source: DebtEventSourceEnum.MANUAL,
        amount,
        operatedAt: OPERATED_AT
    });

const seedPartiallySettledDebt = (debtType: AccountDebtTypeEnum, instrumentId = 1): AccountEntityInterface => {
    const account = seedDebtAccount(debtType, convertToMicroUnits(1_000), instrumentId);
    insertDebtEvent(account.id, DebtEventDirectionEnum.OPEN, convertToMicroUnits(1_000));
    insertDebtEvent(account.id, DebtEventDirectionEnum.CLOSE, convertToMicroUnits(250));

    return account;
};

const readProgress = (accountId: number) => {
    const progress = accountBalanceRepository.getDebtAccountProgressByAccountId(accountId).get();

    if (!isDefined(progress)) {
        throw new Error(`No debt progress row for account ${accountId}`);
    }

    return progress;
};

const readHomeRow = (accountId: number, defaultInstrumentId: number) => {
    const row = accountBalanceRepository
        .getHomeAccountRows(defaultInstrumentId)
        .all()
        .find(homeRow => homeRow.account.id === accountId);

    if (!isDefined(row)) {
        throw new Error(`No home account row for account ${accountId}`);
    }

    return row;
};

const updateDebtEventAmount = (debtEventId: number, amount: number): void => {
    testDb.update(DebtEventEntityTable).set({ amount }).where(eq(DebtEventEntityTable.id, debtEventId)).run();
};

const softDeleteDebtEvent = (debtEventId: number): void => {
    testDb.update(DebtEventEntityTable).set({ deletedAt: new Date() }).where(eq(DebtEventEntityTable.id, debtEventId)).run();
};

const sumConvertedOutstandingByDebtType = (defaultInstrumentId: number, debtType: AccountDebtTypeEnum): number =>
    accountBalanceRepository
        .getHomeAccountRows(defaultInstrumentId)
        .all()
        .filter(row => row.account.type === AccountTypeEnum.DEBT && row.account.isActive && row.account.debtType === debtType)
        .reduce((total, row) => total + convertFromMicroUnits(row.convertedDebtOutstandingAmount), 0);

const findCloseDebtEvent = (accountId: number): DebtEventEntityInterface => {
    const settlement = testDb
        .select()
        .from(DebtEventEntityTable)
        .all()
        .find(event => event.debtAccountId === accountId && event.direction === DebtEventDirectionEnum.CLOSE);

    if (!isDefined(settlement)) {
        throw new Error(`Expected a seeded settlement debt event for account ${accountId}`);
    }

    return settlement;
};

const expectDebtProgressContract = (
    accountId: number,
    expected: { readonly outstandingAmount: number; readonly paidAmount: number; readonly totalAmount: number; readonly percentage: number }
): void => {
    const progress = readProgress(accountId);

    expect(convertFromMicroUnits(progress.outstandingAmount)).toBe(expected.outstandingAmount);
    expect(convertFromMicroUnits(progress.paidAmount)).toBe(expected.paidAmount);
    expect(convertFromMicroUnits(progress.totalAmount)).toBe(expected.totalAmount);
    expect(progress.percentage).toBe(expected.percentage);
};

describe.each([AccountDebtTypeEnum.LENT, AccountDebtTypeEnum.BORROW])('debt remaining balance contract - %s', debtType => {
    it('reports outstanding/paid/total/percentage for a partial settlement', () => {
        const account = seedPartiallySettledDebt(debtType);

        expectDebtProgressContract(account.id, { outstandingAmount: 750, paidAmount: 250, totalAmount: 1_000, percentage: 25 });
    });

    it('sums the section total in the default instrument when the debt is already in the default currency', () => {
        const account = seedPartiallySettledDebt(debtType);
        const row = readHomeRow(account.id, account.instrumentId);
        const sectionTotal = sumConvertedOutstandingByDebtType(account.instrumentId, debtType);

        expect(row.debtOutstandingAmount).toBe(convertToMicroUnits(750));
        expect(convertFromMicroUnits(row.convertedDebtOutstandingAmount)).toBe(750);
        expect(sectionTotal).toBe(750);
    });

    it('converts the outstanding amount using the seeded exchange rate while keeping the unconverted amount stable', async () => {
        const usdInstrument = await requireInstrument(CurrencyEnum.USD);
        const eurInstrument = await requireInstrument(CurrencyEnum.EUR);
        const exchangeRate = 0.7;
        await exchangeRateRepository.upsert(usdInstrument.id, eurInstrument.id, exchangeRate, 'test');

        const account = seedPartiallySettledDebt(debtType, usdInstrument.id);
        const row = readHomeRow(account.id, eurInstrument.id);
        const sectionTotal = sumConvertedOutstandingByDebtType(eurInstrument.id, debtType);

        expect(row.debtOutstandingAmount).toBe(convertToMicroUnits(750));
        expect(convertFromMicroUnits(row.convertedDebtOutstandingAmount)).toBeCloseTo(750 * exchangeRate, 5);
        expect(sectionTotal).toBeCloseTo(750 * exchangeRate, 5);
    });

    it('recomputes outstanding/paid after the settlement amount is edited', () => {
        const account = seedPartiallySettledDebt(debtType);
        const settlement = findCloseDebtEvent(account.id);

        updateDebtEventAmount(settlement.id, convertToMicroUnits(400));

        expectDebtProgressContract(account.id, { outstandingAmount: 600, paidAmount: 400, totalAmount: 1_000, percentage: 40 });
    });

    it('does not shrink the total when the settlement is soft-deleted', () => {
        const account = seedPartiallySettledDebt(debtType);
        const settlement = findCloseDebtEvent(account.id);

        softDeleteDebtEvent(settlement.id);

        expectDebtProgressContract(account.id, { outstandingAmount: 1_000, paidAmount: 0, totalAmount: 1_000, percentage: 0 });
    });

    it('reports the same outstanding/paid/total/percentage contract for a legacy opening-balance snapshot after migration backfills debt events', async () => {
        const accountId =
            debtType === AccountDebtTypeEnum.LENT ? LegacyDebtContractFixture.LENT_ACCOUNT_ID : LegacyDebtContractFixture.BORROW_ACCOUNT_ID;
        const fixture = new LegacyDebtContractFixture(preMigrationFixturePath);
        const preparedFixturePath = fixture.prepare();

        try {
            const migratedDb = buildTestDb(preparedFixturePath);

            try {
                const migratedAccountBalanceRepository = createTestRepositories(migratedDb).accountBalanceRepository;
                const progress = migratedAccountBalanceRepository.getDebtAccountProgressByAccountId(accountId).get();

                if (!isDefined(progress)) {
                    throw new Error(`No migrated debt progress row for legacy account ${accountId}`);
                }

                expect(convertFromMicroUnits(progress.outstandingAmount)).toBe(750);
                expect(convertFromMicroUnits(progress.paidAmount)).toBe(250);
                expect(convertFromMicroUnits(progress.totalAmount)).toBe(1_000);
                expect(progress.percentage).toBe(25);

                const homeRow = migratedAccountBalanceRepository
                    .getHomeAccountRows(1)
                    .all()
                    .find(row => row.account.id === accountId);

                if (!isDefined(homeRow)) {
                    throw new Error(`No migrated home account row for legacy account ${accountId}`);
                }

                expect(convertFromMicroUnits(homeRow.debtOutstandingAmount)).toBe(750);
            } finally {
                await migratedDb.$client.closeAsync();
            }
        } finally {
            fixture.cleanup();
        }
    });

    it('reports a zero-total account without NaN', () => {
        const account = seedDebtAccount(debtType, 0);

        expectDebtProgressContract(account.id, { outstandingAmount: 0, paidAmount: 0, totalAmount: 0, percentage: 0 });
    });

    it('reports the target amount as fully outstanding before any debt events exist', () => {
        const account = seedDebtAccount(debtType, convertToMicroUnits(13_000));

        expectDebtProgressContract(account.id, { outstandingAmount: 13_000, paidAmount: 0, totalAmount: 13_000, percentage: 0 });
    });

    it('pins current behaviour: an overpayment inflates the total instead of capping it at the principal', () => {
        const account = seedDebtAccount(debtType, convertToMicroUnits(1_000));
        insertDebtEvent(account.id, DebtEventDirectionEnum.OPEN, convertToMicroUnits(1_000));
        insertDebtEvent(account.id, DebtEventDirectionEnum.CLOSE, convertToMicroUnits(1_200));

        expectDebtProgressContract(account.id, { outstandingAmount: 0, paidAmount: 1_200, totalAmount: 1_200, percentage: 100 });
    });
});
