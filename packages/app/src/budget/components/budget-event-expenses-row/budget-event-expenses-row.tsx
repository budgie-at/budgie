import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BudgetSelector } from '../../budget.selector';
import { BudgetRowChevron } from '../budget-row-chevron/budget-row-chevron';

interface Props {
    readonly tagId: number;
    readonly periodStart: Date;
    readonly periodEnd: Date;
}

export const BudgetEventExpensesRow = ({ tagId, periodStart, periodEnd }: Props) => {
    const handlePress = () => {
        router.push({
            pathname: '/analytics/transactions',
            params: {
                type: TransactionTypeEnum.EXPENSE,
                tagId: String(tagId),
                startDate: periodStart.toISOString(),
                endDate: periodEnd.toISOString()
            }
        });
    };

    return (
        <HapticPressable
            accessibilityRole="button"
            className="min-h-[44px] flex-row items-center gap-x-xl py-xs active:opacity-70"
            testID={BudgetSelector.EventExpensesRow}
            onPress={handlePress}
        >
            <GroupedListIcon icon={UserIconNameEnum.ReceiptText} />
            <Text className="text-primary flex-1 text-sm font-medium" numberOfLines={1}>
                <Trans>All event expenses</Trans>
            </Text>
            <BudgetRowChevron />
        </HapticPressable>
    );
};
