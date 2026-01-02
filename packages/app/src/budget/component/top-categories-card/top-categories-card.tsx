import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { TopCategoryItem } from '../top-category-item/top-category-item';

export interface TopCategoryData {
    readonly name: string;
    readonly icon: UserIconNameEnum;
    readonly spentFormatted: string;
    readonly percentage: number;
    readonly isOverBudget: boolean;
}

interface Props {
    readonly categories: readonly TopCategoryData[];
}

export const TopCategoriesCard = ({ categories }: Props) => (
    <Card className="gap-3">
        <Text className="text-xs uppercase text-secondary-foreground">
            <Trans>Top Categories</Trans>
        </Text>

        {categories.map(cat => (
            <TopCategoryItem
                key={cat.name}
                name={cat.name}
                icon={cat.icon}
                spentFormatted={cat.spentFormatted}
                percentage={cat.percentage}
                isOverBudget={cat.isOverBudget}
            />
        ))}
    </Card>
);
