import { budgetPeriodService } from '@budgie/budget';
import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetCategoryLimitsQuery } from '../../query/use-get-budget-category-limits.query';
import { useGetBudgetSpentQuery } from '../../query/use-get-budget-spent.query';
import { formatBudgetPeriodLabel } from '../../utils/format-budget-period-label.util';
import { BudgetDetailsCategoryList } from '../budget-details-category-list/budget-details-category-list';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetDetails = ({ budget }: Props) => {
    const { spent } = useGetBudgetSpentQuery(budget);
    const { categoryLimits } = useGetBudgetCategoryLimitsQuery(budget.id);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const periodWindow = budgetPeriodService.computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date());
    const periodEnd = budgetPeriodService.getInclusiveEnd(periodWindow.nextPeriodStart);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const dateLabel = formatBudgetPeriodLabel(budget, useFormatDate().formatMonthAndDay);
    const displaySpent = convertFromMicroUnits(spent.spentOverall);
    const hasCategoryLimitsContent = isNotEmptyArray(categoryLimits) || isPositiveNumber(budget.otherLimit);

    const handleEditPress = () => {
        router.push({ pathname: '/budget/edit', params: { id: String(budget.id) } });
    };

    const categoryLimitsContent = hasCategoryLimitsContent ? (
        <BudgetDetailsCategoryList
            categoryLimits={categoryLimits}
            spentByCategory={spent.spentByCategory}
            spentOverall={spent.spentOverall}
            otherLimitAmount={budget.otherLimit}
            periodStart={periodWindow.periodStart}
            periodEnd={periodEnd}
            currencySymbol={currencySymbol}
        />
    ) : (
        <Text className="text-secondary-foreground text-sm">
            <Trans>No category limits yet</Trans>
        </Text>
    );

    const headerAction = (
        <HapticPressable
            accessible
            accessibilityLabel={t`Manage budget`}
            accessibilityRole="button"
            className="relative h-[40px] w-[40px]"
            collapsable={false}
            nativeID={BudgetSelector.DetailsEditButton}
            testID={BudgetSelector.DetailsEditButton}
            onPress={handleEditPress}
        >
            <View
                collapsable={false}
                nativeID={BudgetSelector.DetailsEditButton}
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                testID={BudgetSelector.DetailsEditButton}
            />
            <CircleIcon icon={UserIconNameEnum.EllipsisVertical} variant="ghost" size={40} iconSize={24} border={false} />
        </HapticPressable>
    );

    return (
        <CollapsibleChromePage
            title={t`Budget details`}
            leading={<HeaderBackButton />}
            trailing={headerAction}
            contentClassName="gap-y-7xl"
        >
            <View className="gap-y-md">
                <View className="flex-row items-center justify-between">
                    <Text className="text-primary text-lg font-semibold">
                        <Trans>Monthly budget</Trans>
                    </Text>
                    <Text className="text-secondary-foreground text-sm">{formatDigits(displaySpent, currencySymbol)}</Text>
                </View>

                <Text className="text-secondary-foreground text-xs">{dateLabel}</Text>

                <BudgetProgressBar
                    spent={spent.spentOverall}
                    limit={budget.overallLimit}
                    spentTestID={BudgetSelector.DetailsSpentLabel}
                    currencySymbol={currencySymbol}
                    remainingTestID={BudgetSelector.DetailsRemainingLabel}
                />
            </View>

            <View className="gap-y-md">
                <Text className="text-primary text-lg font-semibold">
                    <Trans>Category limits</Trans>
                </Text>

                {categoryLimitsContent}
            </View>
        </CollapsibleChromePage>
    );
};
