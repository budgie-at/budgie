import { BudgetCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Controller, UseControllerReturn, useWatch } from 'react-hook-form';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '../../../../@generic/component/button/button';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { ThemedSwitch } from '../../../../@generic/component/themed-switch/themed-switch';
import { useBudgetSetupContext } from '../../../../budget/context/budget-setup.context';
import { SettingsCard } from '../../../../settings/components/settings-card/settings-card';
import { SettingsGroup } from '../../../../settings/components/settings-group/settings-group';

export default function BudgetSetupRolloverPage() {
    const { t } = useLingui();
    const { form } = useBudgetSetupContext();

    const rolloverEnabled = useWatch({ control: form.control, name: 'rolloverEnabled' }) === true;

    useEffect(() => {
        if (!rolloverEnabled) {
            form.setValue('rolloverDeficitEnabled', false);
        }
    }, [rolloverEnabled, form]);

    const handleGoBack = () => void router.back();

    const handleContinue = () => {
        router.push('/budget/setup/amount');
    };

    const deficitDisabled = !rolloverEnabled;
    const deficitVariant = rolloverEnabled ? 'warning' : 'ghost';

    const renderRolloverSwitch = ({ field }: UseControllerReturn<BudgetCreateInputInterface, 'rolloverEnabled'>) => (
        <SettingsCard
            icon={UserIconNameEnum.ArrowRightLeft}
            variant="primary"
            title={t`Carry over unspent budget`}
            description={t`Unspent money rolls over to next period`}
            right={<ThemedSwitch value={field.value} onValueChange={field.onChange} />}
        />
    );

    const renderDeficitSwitch = ({ field }: UseControllerReturn<BudgetCreateInputInterface, 'rolloverDeficitEnabled'>) => (
        <SettingsCard
            icon={UserIconNameEnum.TrendingDown}
            variant={deficitVariant}
            title={t`Include deficit in rollover`}
            description={t`Overspending reduces next period's budget`}
            right={<ThemedSwitch value={field.value} onValueChange={field.onChange} disabled={deficitDisabled} />}
            disabled={deficitDisabled}
        />
    );

    /* jscpd:ignore-start */
    return (
        <Page header={<PageHeader title={t`Rollover Settings`} onGoBack={handleGoBack} />}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="py-5xl gap-y-7xl">
                    <SettingsGroup title={t`Budget Rollover`}>
                        <Controller control={form.control} name="rolloverEnabled" render={renderRolloverSwitch} />
                        <Controller
                            key={`deficit-${String(rolloverEnabled)}`}
                            control={form.control}
                            name="rolloverDeficitEnabled"
                            render={renderDeficitSwitch}
                        />
                    </SettingsGroup>

                    <View className="gap-y-md px-lg">
                        <Text className="text-sm text-secondary-foreground">
                            <Trans>
                                Rollover allows unused budget to carry forward. If enabled, any unspent amount at the end of a budget period
                                will be added to your next period.
                            </Trans>
                        </Text>
                        <Text className="text-sm text-secondary-foreground">
                            <Trans>
                                When deficit rollover is enabled, overspending will reduce your available budget in the next period.
                            </Trans>
                        </Text>
                    </View>

                    <Button variant="primary" content={<Trans>Continue</Trans>} onPress={handleContinue} />
                </View>
            </ScrollView>
        </Page>
    );
    /* jscpd:ignore-end */
}
