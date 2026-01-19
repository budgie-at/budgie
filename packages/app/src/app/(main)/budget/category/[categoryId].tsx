import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../../@generic/component/card/card';
import { EmptyState } from '../../../../@generic/component/empty-state/empty-state';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { BudgetProgressBar } from '../../../../budget/components/budget-progress-bar/budget-progress-bar';
import { useGetActiveBudgetQuery } from '../../../../budget/query/use-get-active-budget.query';
import { useGetBudgetCalculationQuery } from '../../../../budget/query/use-get-budget-calculation.query';
import { useGetCategoryBudgetTransactionsQuery } from '../../../../budget/query/use-get-category-budget-transactions.query';
import { useFormatDigits } from '../../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../../settings/context/settings.context';
import { TransactionSectionsList } from '../../../../transaction/components/transaction-sections-list/transaction-sections-list';

// eslint-disable-next-line max-lines-per-function, max-statements
export default function BudgetCategoryDetailPage() {
    const { t } = useLingui();
    const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);
    const { symbol } = defaultInstrument;

    const { budget, isLoading: isBudgetLoading } = useGetActiveBudgetQuery();
    const { calculation, isLoading: isCalculationLoading } = useGetBudgetCalculationQuery(budget);

    const categoryIdNumber = Number(categoryId);
    const categoryStatus = calculation?.categoryStatuses.find(status => status.category.id === categoryIdNumber);

    const {
        sections,
        loadMore,
        isLoading: isTransactionsLoading
    } = useGetCategoryBudgetTransactionsQuery({
        categoryId: categoryIdNumber,
        startDate: budget?.startDate ?? new Date(),
        endDate: budget?.endDate ?? new Date()
    });

    const handleGoBack = () => void goBackOrReplace('/budget');

    const balanceAdjustmentLabel = t`Balance Adjustment`;
    const categoriesLabel = t`Categories`;

    if (isBudgetLoading || isCalculationLoading || !isDefined(categoryStatus)) {
        return (
            <Page header={<PageHeader title={t`Category`} onGoBack={handleGoBack} />}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" />
                </View>
            </Page>
        );
    }

    const { category, spent, limit, remaining, percentage, status } = categoryStatus;
    const isOverBudget = remaining < 0;
    const formattedSpent = formatMoney(spent, symbol);
    const formattedLimit = formatMoney(limit, symbol);
    const formattedRemaining = formatMoney(Math.abs(remaining), symbol);

    const listEmptyState = isTransactionsLoading ? (
        <ActivityIndicator size="large" />
    ) : (
        <EmptyState
            circleIcon={UserIconNameEnum.Receipt}
            title={t`No transactions`}
            titleClassName="text-md text-primary font-semibold"
            description={t`No expenses in this category for this period`}
            descriptionClassName="text-center max-w-[250px]"
        />
    );

    /* jscpd:ignore-start */
    return (
        <Page header={<PageHeader title={category.title} icon={category.icon} onGoBack={handleGoBack} />}>
            <View className="flex-1">
                <Card className="mb-xl" size="md">
                    <View className="gap-y-md">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-secondary-foreground">
                                <Trans>Spent</Trans>
                            </Text>
                            <Text className="text-primary font-medium">
                                {formattedSpent} / {formattedLimit}
                            </Text>
                        </View>

                        <BudgetProgressBar percentage={percentage} status={status} />

                        <View className="flex-row justify-between items-center">
                            <Text className="text-secondary-foreground text-sm">{Math.round(percentage)}%</Text>
                            {isOverBudget ? (
                                <Text className="text-destructive-foreground text-sm">
                                    {formattedRemaining} <Trans>over</Trans>
                                </Text>
                            ) : (
                                <Text className="text-positive-foreground text-sm">
                                    {formattedRemaining} <Trans>remaining</Trans>
                                </Text>
                            )}
                        </View>
                    </View>
                </Card>

                <View className="mb-md">
                    <Text className="text-primary font-medium">
                        <Trans>Transactions</Trans>
                    </Text>
                </View>

                <View className="flex-1">
                    <TransactionSectionsList
                        sections={sections}
                        onEndReached={loadMore}
                        listEmptyState={listEmptyState}
                        balanceAdjustmentLabel={balanceAdjustmentLabel}
                        categoriesLabel={categoriesLabel}
                        footerSpacerMultiplier={2}
                    />
                </View>
            </View>
        </Page>
    );
    /* jscpd:ignore-end */
}
