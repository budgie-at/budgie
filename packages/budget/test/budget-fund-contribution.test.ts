import { BudgetPeriodEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { contributeToFund } from '../src/fund/utils/contribute-to-fund.util';
import { settleFund } from '../src/fund/utils/settle-fund.util';

import type { BudgetFundContributionSourceInterface } from '../src/fund/interface/budget-fund-contribution-source.interface';
import type { BudgetFundSettleSourceInterface } from '../src/fund/interface/budget-fund-settle-source.interface';
import type { BudgetPeriodSpecInterface } from '../src/period/interface/budget-period-spec.interface';

const SEPTEMBER = 8;
const OCTOBER = 9;
const NOVEMBER = 10;
const DECEMBER = 11;

const MONTHLY_SPEC: BudgetPeriodSpecInterface = {
    period: BudgetPeriodEnum.MONTHLY,
    periodStartDay: 1,
    useLastDayOfMonth: false,
    periodAnchorDate: null
};

const SEPTEMBER_WINDOW = { periodStart: new Date(2026, SEPTEMBER, 1), nextPeriodStart: new Date(2026, OCTOBER, 1) };
const OCTOBER_WINDOW = { periodStart: new Date(2026, OCTOBER, 1), nextPeriodStart: new Date(2026, NOVEMBER, 1) };

const contributionFund = (overrides: Partial<BudgetFundContributionSourceInterface> = {}): BudgetFundContributionSourceInterface => ({
    targetAmount: 1200,
    fundedAmount: 0,
    dueAt: new Date(2026, DECEMBER, 15),
    createdAt: new Date(2026, SEPTEMBER, 10),
    lastFundedPeriodStart: null,
    ...overrides
});

it.effect('funds each closed period with that period set-aside', () =>
    Effect.sync(() => {
        expect(contributeToFund(contributionFund(), [SEPTEMBER_WINDOW, OCTOBER_WINDOW], MONTHLY_SPEC)).toEqual({
            fundedAmount: 600,
            lastFundedPeriodStart: new Date(2026, OCTOBER, 1)
        });
    })
);

it.effect('does not fund a period twice', () =>
    Effect.sync(() => {
        const funded = contributionFund({ fundedAmount: 600, lastFundedPeriodStart: new Date(2026, OCTOBER, 1) });

        expect(contributeToFund(funded, [SEPTEMBER_WINDOW, OCTOBER_WINDOW], MONTHLY_SPEC)).toEqual({
            fundedAmount: 600,
            lastFundedPeriodStart: new Date(2026, OCTOBER, 1)
        });
    })
);

it.effect('continues from the last funded period', () =>
    Effect.sync(() => {
        const funded = contributionFund({ fundedAmount: 300, lastFundedPeriodStart: new Date(2026, SEPTEMBER, 1) });

        expect(contributeToFund(funded, [SEPTEMBER_WINDOW, OCTOBER_WINDOW], MONTHLY_SPEC)).toEqual({
            fundedAmount: 600,
            lastFundedPeriodStart: new Date(2026, OCTOBER, 1)
        });
    })
);

it.effect('skips periods that ended before the fund was created', () =>
    Effect.sync(() => {
        const created = contributionFund({ createdAt: new Date(2026, OCTOBER, 20) });

        expect(contributeToFund(created, [SEPTEMBER_WINDOW, OCTOBER_WINDOW], MONTHLY_SPEC)).toEqual({
            fundedAmount: 400,
            lastFundedPeriodStart: new Date(2026, OCTOBER, 1)
        });
    })
);

it.effect('records the period but adds nothing for a fully funded fund', () =>
    Effect.sync(() => {
        const full = contributionFund({ fundedAmount: 1200 });

        expect(contributeToFund(full, [SEPTEMBER_WINDOW], MONTHLY_SPEC)).toEqual({
            fundedAmount: 1200,
            lastFundedPeriodStart: new Date(2026, SEPTEMBER, 1)
        });
    })
);

it.effect('returns the fund untouched without closed periods', () =>
    Effect.sync(() => {
        expect(contributeToFund(contributionFund({ fundedAmount: 50 }), [], MONTHLY_SPEC)).toEqual({
            fundedAmount: 50,
            lastFundedPeriodStart: null
        });
    })
);

const settleSource = (overrides: Partial<BudgetFundSettleSourceInterface> = {}): BudgetFundSettleSourceInterface => ({
    id: 1,
    categoryId: 5,
    fundedAmount: 600,
    dueAt: new Date(2026, DECEMBER, 15),
    repeatEveryMonths: null,
    ...overrides
});

const insuranceSpend = (amount: number) => ({ entryId: 1, categoryId: 5, amount, operatedAt: new Date(2026, DECEMBER, 10, 12) });

it.effect('consumes the drawn amount and finishes a one-off fund', () =>
    Effect.sync(() => {
        expect(settleFund(settleSource(), [insuranceSpend(400)])).toEqual({
            fundedAmount: 200,
            dueAt: new Date(2026, DECEMBER, 15),
            isFinished: true
        });
    })
);

it.effect('rolls a repeating fund to the next due date and keeps the leftover balance', () =>
    Effect.sync(() => {
        expect(settleFund(settleSource({ repeatEveryMonths: 12 }), [insuranceSpend(400)])).toEqual({
            fundedAmount: 200,
            dueAt: new Date(2027, DECEMBER, 15),
            isFinished: false
        });
    })
);

it.effect('never draws more than the fund balance', () =>
    Effect.sync(() => {
        expect(settleFund(settleSource({ repeatEveryMonths: 12 }), [insuranceSpend(900)]).fundedAmount).toBe(0);
    })
);

it.effect('keeps the full balance when nothing was bought', () =>
    Effect.sync(() => {
        expect(settleFund(settleSource({ repeatEveryMonths: 12 }), []).fundedAmount).toBe(600);
    })
);
