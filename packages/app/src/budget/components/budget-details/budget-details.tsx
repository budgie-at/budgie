import { computePeriodWindow, getInclusiveEnd } from '@budgie/budget';
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
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetProjectionQuery } from '../../query/use-get-budget-projection.query';
import { formatBudgetPeriodLabel } from '../../utils/format-budget-period-label.util';
import { BudgetDetailsCategoryList } from '../budget-details-category-list/budget-details-category-list';
import { BudgetVerdict } from '../budget-verdict/budget-verdict';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetDetails = ({ budget }: Props) => {
    const { projection, isLoading } = useGetBudgetProjectionQuery(budget);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const periodWindow = computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, useToday());
    const periodEnd = getInclusiveEnd(periodWindow.nextPeriodStart);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const dateLabel = formatBudgetPeriodLabel(budget, useFormatDate().formatMonthAndDay);
    const hasCategoryLimitsContent = isNotEmptyArray(projection.categories) || isPositiveNumber(budget.otherLimit);

    const handleEditPress = () => {
        router.push({ pathname: '/budget/edit', params: { id: String(budget.id) } });
    };

    const categoryLimitsContent = hasCategoryLimitsContent ? (
        <BudgetDetailsCategoryList
            projection={projection}
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
            subtitle={dateLabel}
            leading={<HeaderBackButton />}
            trailing={headerAction}
            contentClassName="gap-y-7xl"
        >
            <LoadingContent isLoading={isLoading}>
                <BudgetVerdict projection={projection} currencySymbol={currencySymbol} periodEnd={periodEnd} />
            </LoadingContent>

            <View className="gap-y-md">
                <Text className="text-primary text-lg font-semibold">
                    <Trans>Category limits</Trans>
                </Text>

                <LoadingContent isLoading={isLoading} className="gap-y-md">
                    {categoryLimitsContent}
                </LoadingContent>
            </View>
        </CollapsibleChromePage>
    );
};
