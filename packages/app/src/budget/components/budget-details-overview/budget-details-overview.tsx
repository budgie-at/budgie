import { BudgetLimitSourceEnum } from '@budgie/contracts';
import { Fragment } from 'react';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { BudgetAllocationBlock } from '../budget-allocation-block/budget-allocation-block';
import { BudgetDayStrip } from '../budget-day-strip/budget-day-strip';
import { BudgetDetailsCategoryList } from '../budget-details-category-list/budget-details-category-list';
import { BudgetDetailsForecast } from '../budget-details-forecast/budget-details-forecast';
import { BudgetStatRow } from '../budget-stat-row/budget-stat-row';
import { BudgetVerdict } from '../budget-verdict/budget-verdict';

import type { BudgetHighlightTargetInterface } from '../../interface/budget-highlight-target.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly projection: BudgetProjectionInterface;
    readonly isLoading: boolean;
    readonly currencySymbol: string;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly onFigurePress?: () => void;
    readonly onPaceHintPress?: (target: BudgetHighlightTargetInterface) => void;
}

export const BudgetDetailsOverview = (props: Props) => {
    const { budget, projection, isLoading, currencySymbol, periodStart, periodEnd, onFigurePress, onPaceHintPress } = props;
    const allocationBlock =
        budget.limitSource === BudgetLimitSourceEnum.FIXED ? null : (
            <BudgetAllocationBlock projection={projection} budget={budget} currencySymbol={currencySymbol} />
        );

    return (
        <Fragment>
            <LoadingContent isLoading={isLoading}>
                <BudgetVerdict
                    projection={projection}
                    currencySymbol={currencySymbol}
                    onFigurePress={onFigurePress}
                    onPaceHintPress={onPaceHintPress}
                />
            </LoadingContent>

            <LoadingContent isLoading={isLoading}>
                <BudgetDayStrip projection={projection} period={budget.period} currencySymbol={currencySymbol} />
            </LoadingContent>

            <LoadingContent isLoading={isLoading}>
                <BudgetStatRow scope={projection.overall} limitSource={budget.limitSource} currencySymbol={currencySymbol} />
            </LoadingContent>

            {allocationBlock}

            <BudgetDetailsForecast projection={projection} currencySymbol={currencySymbol} isLoading={isLoading} />

            <LoadingContent isLoading={isLoading}>
                <BudgetDetailsCategoryList
                    budget={budget}
                    projection={projection}
                    periodStart={periodStart}
                    periodEnd={periodEnd}
                    currencySymbol={currencySymbol}
                />
            </LoadingContent>
        </Fragment>
    );
};
