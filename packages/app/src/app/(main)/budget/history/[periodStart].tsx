import { Trans, useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { BudgetComparisonCard } from '../../../../budget/components/budget-comparison-card/budget-comparison-card';
import { BudgetSnapshotCategoryBreakdown } from '../../../../budget/components/budget-snapshot-category-breakdown/budget-snapshot-category-breakdown';
import { CategoryLimitSnapshotInterface } from '../../../../budget/interface/category-limit-snapshot.interface';
import { useGetBudgetPeriodDetailQuery } from '../../../../budget/query/use-get-budget-period-detail.query';
import { budgetHistoryService } from '../../../../budget/service/budget-history.service';
import { useAllCategoriesQuery } from '../../../../category/query/use-all-categories.query';
import { useFormatDate } from '../../../../i18n/hook/use-format-date.hook';

const SCROLL_VIEW_CONTENT_STYLE = { paddingBottom: 100 };

const parsePeriodStart = (periodStartParam: string | undefined): Date | null => {
    const timestamp = isDefined(periodStartParam) ? Number(periodStartParam) : null;

    return isPositiveNumber(timestamp) ? new Date(timestamp) : null;
};

const buildPageTitle = (
    periodStart: Date | null,
    periodEnd: Date | null,
    formatMonthAndDay: (date: Date) => string,
    fallback: string
): string => {
    if (!isDefined(periodStart) || !isDefined(periodEnd)) {
        return fallback;
    }

    return `${formatMonthAndDay(periodStart)} - ${formatMonthAndDay(periodEnd)}`;
};

const getCategoryLimits = (categoryLimitsJson: string | null): CategoryLimitSnapshotInterface[] =>
    budgetHistoryService.parseCategoryLimitsJson(categoryLimitsJson);

export default function BudgetPeriodDetailScreen() {
    const { t } = useLingui();
    const { periodStart: periodStartParam } = useLocalSearchParams<{ periodStart: string }>();
    const { formatMonthAndDay } = useFormatDate();
    const { categories } = useAllCategoriesQuery();

    const periodStartDate = parsePeriodStart(periodStartParam);
    const { snapshot, previousPeriod, currentPeriod, comparison, isLoading } = useGetBudgetPeriodDetailQuery(periodStartDate, t`Current`);

    const handleGoBack = () => void goBackOrReplace('/budget/history');

    const pageTitle = buildPageTitle(snapshot?.periodStart ?? null, snapshot?.periodEnd ?? null, formatMonthAndDay, t`Period Details`);
    const categoryLimits = isDefined(snapshot) ? getCategoryLimits(snapshot.categoryLimitsJson) : [];

    /* jscpd:ignore-start */
    if (isLoading) {
        return (
            <Page header={<PageHeader title={pageTitle} onGoBack={handleGoBack} />}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground">
                        <Trans>Loading...</Trans>
                    </Text>
                </View>
            </Page>
        );
    }

    if (!isDefined(snapshot)) {
        return (
            <Page header={<PageHeader title={t`Period Details`} onGoBack={handleGoBack} />}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground">
                        <Trans>Period not found</Trans>
                    </Text>
                </View>
            </Page>
        );
    }

    return (
        <Page header={<PageHeader title={pageTitle} onGoBack={handleGoBack} />}>
            <ScrollView className="flex-1" contentContainerStyle={SCROLL_VIEW_CONTENT_STYLE}>
                <View className="gap-y-xl py-xl">
                    {isDefined(comparison) && isDefined(currentPeriod) && isDefined(previousPeriod) ? (
                        <BudgetComparisonCard currentPeriod={currentPeriod} previousPeriod={previousPeriod} comparison={comparison} />
                    ) : null}
                    <BudgetSnapshotCategoryBreakdown categoryLimits={categoryLimits} categories={categories} />
                </View>
            </ScrollView>
        </Page>
    );
    /* jscpd:ignore-end */
}
