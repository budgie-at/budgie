import { statisticsRepository } from '@app/@generic/drizzle/db/db';
import { aggregateRunwayDrivers } from '@app/runway/utils/aggregate-runway-drivers.util';
import { computeRunway } from '@app/runway/utils/compute-runway.util';
import { median } from '@app/runway/utils/median.util';
import {
    CategoryEntityTable,
    UserIconNameEnum,
    CurrencyEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    LanguageEnum,
    PRECISION,
    RUNWAY_MAX_MONTHS,
    RunwayDriverDimensionEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { requireInstrument } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { seed } from '../../harness/seed/seed';

import type { RunwayComputationInterface } from '@app/runway/interface/runway-computation.interface';
import type { RunwayDriverBreakdownInterface } from '@app/runway/interface/runway-driver-breakdown.interface';
import type { RunwayDriverInterface } from '@app/runway/interface/runway-driver.interface';
import type { TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

const REGULAR_MONTHLY_AMOUNT = 100 * PRECISION;
const ONE_OFF_AMOUNT = 60 * PRECISION;
const FIRST_TAIL_AMOUNT = PRECISION;
const SECOND_TAIL_AMOUNT = PRECISION / 2;
const UNTAGGED_AMOUNT = 40 * PRECISION;
const SEEDED_MONTHS = 4;

const seedCategory = (title: string): { readonly id: number; readonly title: string } =>
    insertOne(CategoryEntityTable, { title, titleSearch: title.toLowerCase(), icon: UserIconNameEnum.Wallet, parentId: null });

const monthOperatedAt = (monthsAgo: number): Date => {
    const now = new Date();

    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 15, 12));
};

const seedExpense = (accountId: number, categoryId: number, amount: number, monthsAgo: number): number => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: `Runway driver expense ${categoryId} ${monthsAgo}`,
        operatedAt: monthOperatedAt(monthsAgo),
        comment: '',
        toAccountId: null,
        fromAccountId: accountId,
        exchangeRate: 1,
        externalId: null,
        externalSource: ExternalSourceEnum.CSV,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount,
        categoryId,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: null,
        baseExchangeRate: null,
        baseAmount: null,
        toIban: null
    } satisfies TransactionEntryCreateEntityInterface);

    return transaction.id;
};

const requireDriver = (drivers: readonly RunwayDriverInterface[], categoryId: number): RunwayDriverInterface => {
    const driver = drivers.find(row => row.id === categoryId);

    if (!isDefined(driver)) {
        throw new Error(`Driver ${categoryId} not found`);
    }

    return driver;
};

const aggregate = (
    dimension: RunwayDriverDimensionEnum,
    instrumentId: number
): RunwayDriverBreakdownInterface & { readonly computation: RunwayComputationInterface } => {
    const seriesRows = statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, RUNWAY_MAX_MONTHS).all();
    const driverRows = statisticsRepository
        .getRunwayDriverSeriesQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, dimension, RUNWAY_MAX_MONTHS, LanguageEnum.EN)
        .all();
    const breakdown = aggregateRunwayDrivers(driverRows, median(seriesRows.map(row => row.expense)));
    const computation = computeRunway({
        series: seriesRows,
        liquid: 0,
        irregularMonthlyAmount: breakdown.irregularMonthlyAmount,
        referenceDate: new Date()
    });

    return { ...breakdown, computation };
};

describe('runway drivers', () => {
    it('divides by months with data, flags only one-offs and folds the long tail', async () => {
        const hryvnia = await requireInstrument(CurrencyEnum.UAH);
        const account = seed.account({ instrumentId: hryvnia.id });
        const regular = seedCategory('Groceries');
        const oneOff = seedCategory('Dentist');
        const firstTail = seedCategory('Stamps');
        const secondTail = seedCategory('Candles');

        Array.from({ length: SEEDED_MONTHS }, (_, index) => index + 1).forEach(monthsAgo => {
            seedExpense(account.id, regular.id, REGULAR_MONTHLY_AMOUNT, monthsAgo);
        });
        seedExpense(account.id, oneOff.id, ONE_OFF_AMOUNT, 2);
        seedExpense(account.id, firstTail.id, FIRST_TAIL_AMOUNT, 3);
        seedExpense(account.id, secondTail.id, SECOND_TAIL_AMOUNT, 1);

        const { drivers, irregularMonthlyAmount, computation } = aggregate(RunwayDriverDimensionEnum.CATEGORY, hryvnia.id);
        const other = drivers.at(-1);

        expect(requireDriver(drivers, regular.id)).toStrictEqual({
            id: regular.id,
            title: regular.title,
            monthlyAmount: REGULAR_MONTHLY_AMOUNT,
            isIrregular: false,
            foldedDriverCount: 0
        });
        expect(requireDriver(drivers, oneOff.id)).toStrictEqual({
            id: oneOff.id,
            title: oneOff.title,
            monthlyAmount: ONE_OFF_AMOUNT / SEEDED_MONTHS,
            isIrregular: true,
            foldedDriverCount: 0
        });
        expect(other).toStrictEqual({
            id: null,
            title: '',
            monthlyAmount: (FIRST_TAIL_AMOUNT + SECOND_TAIL_AMOUNT) / SEEDED_MONTHS,
            isIrregular: false,
            foldedDriverCount: 2
        });
        expect(drivers).toHaveLength(3);
        expect(irregularMonthlyAmount).toBe((ONE_OFF_AMOUNT + FIRST_TAIL_AMOUNT + SECOND_TAIL_AMOUNT) / SEEDED_MONTHS);
        expect(computation.allInBurn).toBe(computation.burn + irregularMonthlyAmount);
    });

    it('counts secondary tags and untagged spend in the tag dimension', async () => {
        const hryvnia = await requireInstrument(CurrencyEnum.UAH);
        const account = seed.account({ instrumentId: hryvnia.id });
        const regular = seedCategory('Groceries');
        const tag = seed.tag('Trip');

        Array.from({ length: SEEDED_MONTHS }, (_, index) => index + 1).forEach(monthsAgo => {
            const transactionId = seedExpense(account.id, regular.id, REGULAR_MONTHLY_AMOUNT, monthsAgo);

            seed.transactionTag(transactionId, tag.id);
        });
        seedExpense(account.id, regular.id, UNTAGGED_AMOUNT, 1);

        const { drivers } = aggregate(RunwayDriverDimensionEnum.TAG, hryvnia.id);

        expect(drivers).toStrictEqual([
            {
                id: tag.id,
                title: 'Trip',
                monthlyAmount: REGULAR_MONTHLY_AMOUNT,
                isIrregular: false,
                foldedDriverCount: 0
            },
            {
                id: null,
                title: '',
                monthlyAmount: UNTAGGED_AMOUNT / SEEDED_MONTHS,
                isIrregular: true,
                foldedDriverCount: 0
            }
        ]);
    });
});
