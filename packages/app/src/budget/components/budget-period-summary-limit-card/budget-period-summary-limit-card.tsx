import { StyleSheet, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ProgressTrack } from '../../../@generic/component/progress-track/progress-track';
import { BudgetLimitAmountsRow } from '../budget-limit-amounts-row/budget-limit-amounts-row';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly spent: number;
    readonly limit: number;
    readonly currencySymbol: string;
    readonly testID: string;
    readonly spentTestID: string;
}

const FULL_PERCENT = 100;

export const BudgetPeriodSummaryLimitCard = ({ children, spent, limit, currencySymbol, testID, spentTestID }: Props) => {
    const percentage = isPositiveNumber(limit) ? Math.min((spent / limit) * FULL_PERCENT, FULL_PERCENT) : FULL_PERCENT;
    const fillClassName = spent > limit ? 'bg-destructive-foreground' : 'bg-positive-foreground';

    return (
        <View className="relative" collapsable={false}>
            <Card variant="ghost" size="md" className="gap-y-md">
                <View className="flex-row items-center gap-x-md">{children}</View>
                <ProgressTrack percentage={percentage} className="h-3" fillClassName={fillClassName} />
                <BudgetLimitAmountsRow spent={spent} limit={limit} currencySymbol={currencySymbol} spentTestID={spentTestID} />
            </Card>
            <View collapsable={false} nativeID={testID} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID} />
        </View>
    );
};
