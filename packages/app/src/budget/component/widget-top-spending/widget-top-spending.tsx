import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { WidgetCategoryItem } from '../widget-category-item/widget-category-item';

interface CategoryData {
    readonly name: string;
    readonly icon: UserIconNameEnum;
    readonly spentFormatted: string;
    readonly percentage: number;
    readonly isOverBudget: boolean;
}

interface Props {
    readonly categories: CategoryData[];
}

export const WidgetTopSpending = ({ categories }: Props) => (
    <View className="gap-2 pt-1 border-t border-secondary-corner">
        <Text className="text-xs text-secondary-foreground pt-2">
            <Trans>Top Spending</Trans>
        </Text>
        {categories.map(category => (
            <WidgetCategoryItem
                key={category.name}
                name={category.name}
                icon={category.icon}
                spentFormatted={category.spentFormatted}
                percentage={category.percentage}
                isOverBudget={category.isOverBudget}
            />
        ))}
    </View>
);
