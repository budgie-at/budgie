import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetAnalyticsContent } from '../../../budget/component/budget-analytics-content/budget-analytics-content';
import { useGetBudgetsQuery } from '../../../budget/query/use-get-budgets.query';

export default function BudgetAnalyticsPage() {
    const { t } = useLingui();
    const { budgets } = useGetBudgetsQuery();

    const handleGoBack = () => void goBackOrReplace('/settings');

    return (
        <Page header={<PageHeader onGoBack={handleGoBack} title={t`Budget Analytics`} />}>
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="py-4 gap-4">
                    {isNotEmptyArray(budgets) ? (
                        <BudgetAnalyticsContent budget={budgets[0]} />
                    ) : (
                        <Card className="items-center py-8">
                            <CircleIcon icon="Wallet" size={48} iconSize={24} variant="ghost" border={false} />
                            <Text className="text-sm text-secondary-foreground mt-2">
                                <Trans>No budgets to analyze</Trans>
                            </Text>
                            <Text className="text-xs text-secondary-foreground mt-1 text-center px-4">
                                <Trans>Create a budget to start tracking your spending patterns</Trans>
                            </Text>
                        </Card>
                    )}
                </View>
            </ScrollView>
        </Page>
    );
}
