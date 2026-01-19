import { BudgetAlertEntityInterface, BudgetAlertTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { formatDistanceToNow } from 'date-fns';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

const getIconForAlertType = (type: BudgetAlertTypeEnum): UserIconNameEnum => {
    switch (type) {
        case BudgetAlertTypeEnum.THRESHOLD:
            return UserIconNameEnum.TriangleAlert;
        case BudgetAlertTypeEnum.PACE:
            return UserIconNameEnum.TrendingUp;
        case BudgetAlertTypeEnum.LARGE_EXPENSE:
            return UserIconNameEnum.DollarSign;
        case BudgetAlertTypeEnum.PREDICTIVE:
            return UserIconNameEnum.ChartLine;
        default:
            return UserIconNameEnum.TriangleAlert;
    }
};

const getAlertMessage = (type: BudgetAlertTypeEnum, percentage: number, target: string): MessageDescriptor => {
    switch (type) {
        case BudgetAlertTypeEnum.THRESHOLD:
            return msg`${percentage}% of ${target} budget used`;
        case BudgetAlertTypeEnum.PACE:
            return msg`Spending pace: ${percentage}% used`;
        case BudgetAlertTypeEnum.LARGE_EXPENSE:
            return msg`Large expense (${percentage}% of budget)`;
        case BudgetAlertTypeEnum.PREDICTIVE:
            return msg`Projected to exceed budget`;
        default:
            return msg`Budget alert`;
    }
};

interface Props {
    readonly alert: BudgetAlertEntityInterface;
    readonly categoryName?: string;
    readonly onPress: () => void;
    readonly onDismiss: () => void;
}

export const BudgetAlertRow = ({ alert, categoryName, onPress, onDismiss }: Props) => {
    const { i18n, t } = useLingui();

    const iconName = getIconForAlertType(alert.type);
    const target = categoryName ?? t`Overall Budget`;
    const message = i18n.t(getAlertMessage(alert.type, alert.percentage, target));
    const timeAgo = formatDistanceToNow(alert.createdAt, { addSuffix: true });

    return (
        <Pressable onPress={onPress} className="flex-row items-center gap-3 p-4 bg-secondary-background rounded-xl">
            <View className="w-10 h-10 rounded-full bg-warning-background items-center justify-center">
                <Icon icon={iconName} className="text-warning-foreground" size={20} />
            </View>
            <View className="flex-1">
                <Text className="text-primary font-medium">{target}</Text>
                <Text className="text-secondary-foreground text-sm">{message}</Text>
                <Text className="text-secondary-foreground text-xs mt-1">{timeAgo}</Text>
            </View>
            <Pressable onPress={onDismiss} hitSlop={8}>
                <Icon icon={UserIconNameEnum.X} className="text-secondary-foreground" size={16} />
            </Pressable>
        </Pressable>
    );
};
