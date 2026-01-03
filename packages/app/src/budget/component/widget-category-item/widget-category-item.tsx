import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly name: string;
    readonly icon: UserIconNameEnum;
    readonly spentFormatted: string;
    readonly percentage: number;
    readonly isOverBudget: boolean;
}

const spentVariants = cva('text-xs', {
    variants: {
        isOverBudget: {
            true: 'text-warning-foreground',
            false: 'text-primary'
        }
    }
});

const percentageVariants = cva('text-xs w-10 text-right', {
    variants: {
        isOverBudget: {
            true: 'text-warning-foreground',
            false: 'text-secondary-foreground'
        }
    }
});

export const WidgetCategoryItem = ({ name, icon, spentFormatted, percentage, isOverBudget }: Props) => (
    <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
            <Icon icon={icon} size={14} className="text-secondary-foreground" />
            <Text className="text-xs text-primary flex-1" numberOfLines={1}>
                {name}
            </Text>
        </View>
        <View className="flex-row items-center gap-2">
            <Text className={spentVariants({ isOverBudget })}>{spentFormatted}</Text>
            <Text className={percentageVariants({ isOverBudget })}>{percentage}%</Text>
        </View>
    </View>
);
