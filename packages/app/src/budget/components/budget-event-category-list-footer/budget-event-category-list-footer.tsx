import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { BudgetEventExpensesRow } from '../budget-event-expenses-row/budget-event-expenses-row';
import { BudgetEventOtherSpendingRow } from '../budget-event-other-spending-row/budget-event-other-spending-row';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly categoryIds: readonly number[];
    readonly otherScope: Pick<BudgetProjectionScopeInterface, 'limit' | 'spent'>;
    readonly tagId: number | null;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
}

export const BudgetEventCategoryListFooter = (props: Props) => {
    const { categoryIds, otherScope, tagId, periodStart, periodEnd, currencySymbol } = props;

    return (
        <>
            <BudgetEventOtherSpendingRow
                categoryIds={categoryIds}
                scope={otherScope}
                tagId={tagId}
                periodStart={periodStart}
                periodEnd={periodEnd}
                currencySymbol={currencySymbol}
            />
            {isPositiveNumber(tagId) ? <BudgetEventExpensesRow tagId={tagId} periodStart={periodStart} periodEnd={periodEnd} /> : null}
            <Text className="text-xs text-secondary-foreground">
                <Trans>Ticks show where spending should be by today. Tagged expenses also count in your main budget.</Trans>
            </Text>
        </>
    );
};
