import { CategoryEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetStatusEnum } from '../../enum/budget-status.enum';
import { CategoryLimitSnapshotInterface } from '../../interface/category-limit-snapshot.interface';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly categoryLimits: CategoryLimitSnapshotInterface[];
    readonly categories: CategoryEntityInterface[];
}

const getStatus = (percentage: number): BudgetStatusEnum => {
    if (percentage >= 100) {
        return BudgetStatusEnum.OVER;
    }

    if (percentage >= 80) {
        return BudgetStatusEnum.WARNING;
    }

    return BudgetStatusEnum.ON_TRACK;
};

export const BudgetSnapshotCategoryBreakdown = ({ categoryLimits, categories }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);
    const { symbol } = defaultInstrument;

    if (!isNotEmptyArray(categoryLimits)) {
        return (
            <Card>
                <Text className="text-primary font-medium mb-md">
                    <Trans>Category Breakdown</Trans>
                </Text>
                <Text className="text-secondary-foreground">
                    <Trans>No category limits for this period</Trans>
                </Text>
            </Card>
        );
    }

    return (
        <Card>
            <Text className="text-primary font-medium mb-xl">
                <Trans>Category Breakdown</Trans>
            </Text>
            <View className="gap-y-xl">
                {categoryLimits.map(categoryLimit => {
                    const category = categories.find(category => category.id === categoryLimit.categoryId);
                    const categoryName = category?.title ?? t`Unknown Category`;
                    const percentage = categoryLimit.limit > 0 ? (categoryLimit.spent / categoryLimit.limit) * 100 : 0;
                    const status = getStatus(percentage);

                    return (
                        <View key={categoryLimit.categoryId}>
                            <View className="flex-row justify-between mb-sm">
                                <Text className="text-primary font-medium">{categoryName}</Text>
                                <Text className="text-secondary-foreground">{percentage.toFixed(1)}%</Text>
                            </View>
                            <BudgetProgressBar percentage={percentage} status={status} size="sm" />
                            <View className="flex-row justify-between mt-sm">
                                <Text className="text-secondary-foreground text-sm">
                                    {formatMoney(categoryLimit.spent, symbol)} / {formatMoney(categoryLimit.limit, symbol)}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        </Card>
    );
};
