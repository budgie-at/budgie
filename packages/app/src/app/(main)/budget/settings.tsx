import { BudgetPeriodEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { useSettingsContext } from '../../../settings/context/settings.context';

const getPeriodLabel = (period: BudgetPeriodEnum): string => {
    switch (period) {
        case BudgetPeriodEnum.WEEKLY:
            return 'Weekly';
        case BudgetPeriodEnum.BI_WEEKLY:
            return 'Bi-Weekly';
        case BudgetPeriodEnum.MONTHLY:
            return 'Monthly';
    }
};

export default function BudgetSettingsPage() {
    const { t } = useLingui();

    const { budget, isLoading } = useGetActiveBudgetQuery();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();

    const formatMoney = useFormatDigits(decimalPlaces);

    const handleGoBack = () => void goBackOrReplace('/budget');

    const handleDeleteBudget = () => {
        // TODO: Implement delete budget functionality
    };

    if (isLoading) {
        return (
            <Page header={<PageHeader title={t`Budget Settings`} onGoBack={handleGoBack} />}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground">
                        <Trans>Loading...</Trans>
                    </Text>
                </View>
            </Page>
        );
    }

    if (!isDefined(budget)) {
        return (
            <Page header={<PageHeader title={t`Budget Settings`} onGoBack={handleGoBack} />}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground">
                        <Trans>No active budget found</Trans>
                    </Text>
                </View>
            </Page>
        );
    }

    const periodLabel = getPeriodLabel(budget.period);
    const overallLimitFormatted = formatMoney(budget.overallLimit, defaultInstrument.symbol);

    /* jscpd:ignore-start */
    return (
        <Page header={<PageHeader title={t`Budget Settings`} onGoBack={handleGoBack} />}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="py-5xl gap-y-7xl">
                    <SettingsGroup title={t`Budget Configuration`}>
                        <SettingsCard
                            icon={UserIconNameEnum.Calendar}
                            variant="default"
                            title={t`Budget Period`}
                            description={periodLabel}
                        />
                        <SettingsCard
                            icon={UserIconNameEnum.DollarSign}
                            variant="positive"
                            title={t`Overall Limit`}
                            description={overallLimitFormatted}
                        />
                        <SettingsCard
                            icon={UserIconNameEnum.CalendarDays}
                            variant="ghost"
                            title={t`Period Start Day`}
                            description={String(budget.periodStartDay)}
                        />
                    </SettingsGroup>

                    <SettingsGroup title={t`Danger Zone`}>
                        <Button
                            content={<Trans>Delete Budget</Trans>}
                            variant="destructive"
                            onPress={handleDeleteBudget}
                            leftIcon={UserIconNameEnum.Trash2}
                        />
                    </SettingsGroup>
                </View>
            </ScrollView>
        </Page>
    );
    /* jscpd:ignore-end */
}
