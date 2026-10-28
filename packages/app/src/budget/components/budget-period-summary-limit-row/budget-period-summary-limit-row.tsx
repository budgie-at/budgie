import { StyleSheet, View } from 'react-native';

import { BudgetLimitBar } from '../budget-limit-bar/budget-limit-bar';
import { BudgetLimitRow } from '../budget-limit-row/budget-limit-row';

interface Props {
    readonly title: string;
    readonly carriedAmount: number;
    readonly spent: number;
    readonly limit: number;
    readonly currencySymbol: string;
    readonly testID: string;
    readonly spentTestID: string;
}

export const BudgetPeriodSummaryLimitRow = ({ title, carriedAmount, spent, limit, currencySymbol, testID, spentTestID }: Props) => (
    <View className="relative" collapsable={false}>
        <BudgetLimitRow
            title={title}
            carriedAmount={carriedAmount}
            spent={spent}
            limit={limit}
            currencySymbol={currencySymbol}
            spentTestID={spentTestID}
        >
            <BudgetLimitBar spent={spent} limit={limit} tone={spent > limit ? 'destructive' : 'positive'} />
        </BudgetLimitRow>
        <View collapsable={false} nativeID={testID} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID} />
    </View>
);
