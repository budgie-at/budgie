import { StyleSheet, View } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { BudgetLimitBar } from '../budget-limit-bar/budget-limit-bar';
import { BudgetLimitRow } from '../budget-limit-row/budget-limit-row';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly carriedAmount: number;
    readonly spent: number;
    readonly baseLimit: number;
    readonly currencySymbol: string;
    readonly testID: string;
    readonly spentTestID: string;
    readonly icon: UserIconType;
}

export const BudgetPeriodSummaryLimitRow = (props: Props) => {
    const { title, carriedAmount, spent, baseLimit, currencySymbol, testID, spentTestID, icon } = props;
    const limit = baseLimit + carriedAmount;
    const tone = spent > limit ? 'destructive' : 'positive';

    return (
        <View className="relative flex-row items-start gap-x-xl" collapsable={false}>
            <GroupedListIcon icon={icon} />
            <View className="flex-1 pt-md">
                <BudgetLimitRow
                    title={title}
                    carriedAmount={carriedAmount}
                    spent={spent}
                    limit={limit}
                    currencySymbol={currencySymbol}
                    spentTestID={spentTestID}
                >
                    <BudgetLimitBar spent={spent} limit={limit} tone={tone} />
                </BudgetLimitRow>
            </View>
            <View collapsable={false} nativeID={testID} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID} />
        </View>
    );
};
