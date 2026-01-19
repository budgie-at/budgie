import { BudgetAlertEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { budgetAlertRepository, categoryRepository } from '../../../@generic/drizzle/db/db';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetAlertRow } from '../../../budget/components/budget-alert-row/budget-alert-row';
import { useBudgetPeriodNavigation } from '../../../budget/hook/use-budget-period-navigation.hook';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';

const getCategoryName = (alert: BudgetAlertEntityInterface, categoryNames: Map<number, string>): string | null =>
    isDefined(alert.categoryId) ? (categoryNames.get(alert.categoryId) ?? null) : null;

export default function BudgetAlertsScreen() {
    const { t } = useLingui();

    const [alerts, setAlerts] = useState<BudgetAlertEntityInterface[]>([]);
    const [categoryNames, setCategoryNames] = useState<Map<number, string>>(new Map());

    const { budget } = useGetActiveBudgetQuery();
    const periodNavigation = useBudgetPeriodNavigation(budget);

    const handleGoBack = () => void goBackOrReplace('/budget');

    const handleDismiss = async (alertId: number) => {
        await budgetAlertRepository.dismiss(alertId);
        setAlerts(current => current.filter(alert => alert.id !== alertId));
    };

    const handlePress = (alert: BudgetAlertEntityInterface) => {
        if (isDefined(alert.categoryId)) {
            void router.push(`/budget/category/${alert.categoryId}`);
        }
    };

    useEffect(() => {
        const loadAlerts = async () => {
            if (!isDefined(budget)) {
                return;
            }

            const budgetAlerts = await budgetAlertRepository.findActiveByBudgetId(budget.id, periodNavigation.startDate);
            setAlerts(budgetAlerts);

            const categoryIds = budgetAlerts.filter(alert => isDefined(alert.categoryId)).map(alert => alert.categoryId);
            const validCategoryIds = categoryIds.filter(isDefined);

            if (isNotEmptyArray(validCategoryIds)) {
                const categories = await categoryRepository.findByIds(validCategoryIds);
                const nameMap = new Map(categories.map(category => [category.id, category.title]));
                setCategoryNames(nameMap);
            }
        };

        void loadAlerts();
    }, [budget, periodNavigation.startDate]);

    const renderItem = ({ item }: { item: BudgetAlertEntityInterface }) => {
        const categoryName = getCategoryName(item, categoryNames);
        const handleItemPress = () => void handlePress(item);
        const handleItemDismiss = () => void handleDismiss(item.id);
        const categoryNameProp = isDefined(categoryName) ? { categoryName } : {};

        return <BudgetAlertRow alert={item} {...categoryNameProp} onPress={handleItemPress} onDismiss={handleItemDismiss} />;
    };

    const keyExtractor = (item: BudgetAlertEntityInterface) => String(item.id);

    const emptyState = (
        <View className="flex-1 items-center justify-center py-20">
            <Text className="text-secondary-foreground text-center">
                <Trans>No alerts - you are on track!</Trans>
            </Text>
        </View>
    );

    /* jscpd:ignore-start */
    return (
        <Page header={<PageHeader title={t`Budget Alerts`} onGoBack={handleGoBack} />}>
            <FlatList
                data={alerts}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ListEmptyComponent={emptyState}
                contentContainerClassName="py-4 gap-y-3"
                showsVerticalScrollIndicator={false}
            />
        </Page>
    );
    /* jscpd:ignore-end */
}
