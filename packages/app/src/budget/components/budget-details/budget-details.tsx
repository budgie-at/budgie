import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FormPage } from '../../../@generic/component/form-page/form-page';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetCategoryLimitsQuery } from '../../query/use-get-budget-category-limits.query';
import { useGetBudgetSpentQuery } from '../../query/use-get-budget-spent.query';
import { computePeriodWindow } from '../../utils/compute-period-window.util';
import { formatBudgetPeriodLabel } from '../../utils/format-budget-period-label.util';
import { getBudgetPeriodInclusiveEnd } from '../../utils/get-budget-period-inclusive-end.util';
import { BudgetDetailsCategoryList } from '../budget-details-category-list/budget-details-category-list';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
}

const CONTENT_STYLE = { rowGap: 24 } as const;

const handleGoBack = () => void goBackOrReplace('/');

export const BudgetDetails = ({ budget }: Props) => {
    const { spent } = useGetBudgetSpentQuery(budget);
    const { categoryLimits } = useGetBudgetCategoryLimitsQuery(budget.id);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const periodWindow = computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date());
    const periodEnd = getBudgetPeriodInclusiveEnd(periodWindow.nextPeriodStart);
    const currencySymbol = instrument?.symbol ?? '';
    const dateLabel = formatBudgetPeriodLabel(budget, useFormatDate().formatMonthAndDay);
    const displaySpent = convertFromMicroUnits(spent.spentOverall);

    const handleEditPress = () => {
        router.push({ pathname: '/budget/edit', params: { id: String(budget.id) } });
    };

    const categoryLimitsContent = isNotEmptyArray(categoryLimits) ? (
        <BudgetDetailsCategoryList
            categoryLimits={categoryLimits}
            spentByCategory={spent.spentByCategory}
            spentOverall={spent.spentOverall}
            overallLimit={budget.overallLimit}
            periodStart={periodWindow.periodStart}
            periodEnd={periodEnd}
            currencySymbol={currencySymbol}
        />
    ) : (
        <Text className="text-secondary-foreground text-sm">{t`No category limits yet`}</Text>
    );

    const headerAction = (
        <HapticPressable className="ml-auto" testID={BudgetSelector.DetailsEditButton} onPress={handleEditPress}>
            <CircleIcon icon={UserIconNameEnum.EllipsisVertical} variant="ghost" size={40} iconSize={24} border={false} />
        </HapticPressable>
    );

    return (
        <FormPage
            header={<PageHeader title={t`Budget details`} onGoBack={handleGoBack} right={headerAction} description={dateLabel} />}
            contentContainerStyle={CONTENT_STYLE}
        >
            <View className="gap-y-md">
                <View className="flex-row items-center justify-between">
                    <Text className="text-primary text-lg font-semibold">{t`Monthly budget`}</Text>
                    <Text className="text-secondary-foreground text-sm">{formatDigits(displaySpent, currencySymbol)}</Text>
                </View>

                <BudgetProgressBar
                    spent={spent.spentOverall}
                    limit={budget.overallLimit}
                    spentTestID={BudgetSelector.DetailsSpentLabel}
                    currencySymbol={currencySymbol}
                    remainingTestID={BudgetSelector.DetailsRemainingLabel}
                />
            </View>

            <View className="gap-y-md">
                <Text className="text-primary text-lg font-semibold">{t`Category limits`}</Text>

                {categoryLimitsContent}
            </View>
        </FormPage>
    );
};
