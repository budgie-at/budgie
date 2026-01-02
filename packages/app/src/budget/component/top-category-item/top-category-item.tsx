import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

const spentTextVariants = cva('text-sm font-medium', {
    variants: {
        status: {
            overBudget: 'text-warning-foreground',
            normal: 'text-primary'
        }
    },
    defaultVariants: { status: 'normal' }
});

interface Props {
    readonly name: string;
    readonly icon: UserIconNameEnum;
    readonly spentFormatted: string;
    readonly percentage: number;
    readonly isOverBudget: boolean;
}

export const TopCategoryItem = ({ name, icon, spentFormatted, percentage, isOverBudget }: Props) => {
    const spentStatus = isOverBudget ? 'overBudget' : 'normal';

    return (
        <View className="flex-row items-center gap-2">
            <Icon icon={icon} size={14} className="text-secondary-foreground" />

            <Text className="flex-1 text-sm text-primary" numberOfLines={1}>
                {name}
            </Text>

            <Text className={spentTextVariants({ status: spentStatus })}>{spentFormatted}</Text>
            <Text className="text-xs text-secondary-foreground w-10 text-right">{percentage}%</Text>
        </View>
    );
};
