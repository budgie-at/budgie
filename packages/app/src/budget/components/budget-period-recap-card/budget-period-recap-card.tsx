import { BudgetPeriodSnapshotRepository } from '@budgie/budget';
import { UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BudgetSelector } from '../../budget.selector';
import { getBudgetPeriodLabelDate } from '../../utils/get-budget-period-label-date.util';
import { BudgetPeriodRecapRollover } from '../budget-period-recap-rollover/budget-period-recap-rollover';

import type { BudgetPeriodSnapshotWithCategoriesEntityInterface } from '@budgie/contracts';

interface Props {
    readonly snapshot: BudgetPeriodSnapshotWithCategoriesEntityInterface;
    readonly currencySymbol: string;
}

export const BudgetPeriodRecapCard = ({ snapshot, currencySymbol }: Props) => {
    const { formatFullMonth } = useFormatDate();
    const formatDigits = useDisplayFormatDigits();
    const { t } = useLingui();

    const isUnder = snapshot.overallSpent <= snapshot.overallLimit;
    const month = formatFullMonth(getBudgetPeriodLabelDate(snapshot.periodStart, snapshot.periodEnd));
    const amount = formatDigits(convertFromMicroUnits(Math.abs(snapshot.overallLimit - snapshot.overallSpent)), currencySymbol);
    const title = isUnder ? t`${month} closed ${amount} under` : t`${month} closed ${amount} over`;
    const onBudgetCategoryCount = snapshot.categories.filter(category => category.spent <= category.limitAmount).length;
    const categoryCount = snapshot.categories.length;
    const toneClassName = isUnder ? 'text-positive-foreground' : 'text-destructive-foreground';
    const cardVariant = isUnder ? 'positive' : 'destructive';

    const handleDismiss = () => {
        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(BudgetPeriodSnapshotRepository, budgetPeriodSnapshotRepository =>
                    budgetPeriodSnapshotRepository.markRecapsSeen(snapshot.budgetId)
                )
            )
        );
    };

    return (
        <Card variant={cardVariant} size="md" testID={BudgetSelector.DetailsRecapCard}>
            <View className="flex-row items-start gap-x-md">
                <View className="flex-1 gap-y-xs">
                    <Text className={`${toneClassName} text-md font-semibold`}>{title}</Text>
                    {isNotEmptyArray(snapshot.categories) ? (
                        <Text className="text-secondary-foreground text-sm">
                            {t({
                                message: plural(categoryCount, {
                                    one: `On budget in ${onBudgetCategoryCount} of # category`,
                                    other: `On budget in ${onBudgetCategoryCount} of # categories`
                                })
                            })}
                        </Text>
                    ) : null}
                    <BudgetPeriodRecapRollover snapshot={snapshot} currencySymbol={currencySymbol} />
                </View>

                <HapticPressable
                    accessibilityLabel={t`Dismiss`}
                    accessibilityRole="button"
                    hitSlop={12}
                    testID={BudgetSelector.DetailsRecapDismissButton}
                    onPress={handleDismiss}
                >
                    <Icon icon={UserIconNameEnum.X} size={18} className="text-secondary-foreground" />
                </HapticPressable>
            </View>
        </Card>
    );
};
