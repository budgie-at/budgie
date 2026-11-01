import { isDefined } from '@rnw-community/shared';

import { computeFundSetAside } from './compute-fund-set-aside.util';

import type { BudgetPeriodSpecInterface } from '../../period/interface/budget-period-spec.interface';
import type { BudgetPeriodWindowInterface } from '../../period/interface/budget-period-window.interface';
import type { BudgetFundContributionSourceInterface } from '../interface/budget-fund-contribution-source.interface';
import type { BudgetFundContributionInterface } from '../interface/budget-fund-contribution.interface';

export const contributeToFund = (
    fund: BudgetFundContributionSourceInterface,
    closedWindows: readonly BudgetPeriodWindowInterface[],
    spec: BudgetPeriodSpecInterface
): BudgetFundContributionInterface =>
    closedWindows.reduce<BudgetFundContributionInterface>(
        (state, window) => {
            const isAlreadyFunded =
                isDefined(state.lastFundedPeriodStart) && window.periodStart.getTime() <= state.lastFundedPeriodStart.getTime();
            const isBeforeFund = window.nextPeriodStart.getTime() <= fund.createdAt.getTime();

            if (isAlreadyFunded || isBeforeFund) {
                return state;
            }

            const setAside = computeFundSetAside(
                { targetAmount: fund.targetAmount, fundedAmount: state.fundedAmount, dueAt: fund.dueAt },
                window,
                spec
            );

            return { fundedAmount: state.fundedAmount + setAside, lastFundedPeriodStart: window.periodStart };
        },
        { fundedAmount: fund.fundedAmount, lastFundedPeriodStart: fund.lastFundedPeriodStart }
    );
