import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetSelector } from '../../../budget/budget.selector';
import { BudgetCategoryLimitsCard } from '../../../budget/components/budget-category-limits-card/budget-category-limits-card';
import { BudgetProgressBar } from '../../../budget/components/budget-progress-bar/budget-progress-bar';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { useGetBudgetCategoryLimitsQuery } from '../../../budget/query/use-get-budget-category-limits.query';
import { useGetBudgetSpentQuery } from '../../../budget/query/use-get-budget-spent.query';
import { budgetService } from '../../../budget/service/budget.service';
import { formatBudgetPeriodLabel } from '../../../budget/utils/format-budget-period-label.util';

const handleGoBack = () => void goBackOrReplace('/');

export default function BudgetDetailScreen() {
    const { t } = useLingui();
    const { budget, isLoading } = useGetActiveBudgetQuery();
    const { spent } = useGetBudgetSpentQuery(budget);
    const { categoryLimits } = useGetBudgetCategoryLimitsQuery(isDefined(budget) ? budget.id : null);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(budget)) {
        return <Redirect href="/" />;
    }

    const dateLabel = formatBudgetPeriodLabel(budget, 'long');
    const spentByCategoryMap = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));
    const hasCategoryLimits = isNotEmptyArray(categoryLimits);

    const handleEdit = () => void router.push({ pathname: '/budget/setup', params: { id: String(budget.id) } });

    const handleDelete = async () => {
        const confirmed = await confirmAlert({
            title: t`Delete budget?`,
            message: t`This will remove your monthly budget. You can create a new one anytime.`,
            confirmText: t`Delete`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (!confirmed) {
            return;
        }

        try {
            await budgetService.deleteBudget(budget.id);
            goBackOrReplace('/');
        } catch (error: unknown) {
            Toast.show({ type: 'error', text1: t`Could not delete budget`, text2: getErrorMessage(error) });
        }
    };

    return (
        <Page header={<PageHeader title={t`Budget`} onGoBack={handleGoBack} />} withBlur>
            <View className="pt-16 pb-5xl gap-y-7xl">
                <Card variant="ghost" className="gap-y-lg">
                    <Text className="text-secondary-foreground text-sm">{dateLabel}</Text>
                    <BudgetProgressBar
                        spent={spent.spentOverall}
                        limit={budget.overallLimit}
                        spentTestID={BudgetSelector.DetailSpentLabel}
                    />
                </Card>

                {hasCategoryLimits && <BudgetCategoryLimitsCard categoryLimits={categoryLimits} spentByCategoryMap={spentByCategoryMap} />}

                <View className="gap-y-md">
                    <Button
                        testID={BudgetSelector.DetailEditButton}
                        variant="primary"
                        leftIcon={UserIconNameEnum.Pencil}
                        content={t`Edit budget`}
                        onPress={handleEdit}
                    />
                    <Button
                        testID={BudgetSelector.DetailDeleteButton}
                        variant="destructive"
                        leftIcon={UserIconNameEnum.Trash2}
                        content={t`Delete budget`}
                        onPress={handleDelete}
                    />
                </View>
            </View>
        </Page>
    );
}
