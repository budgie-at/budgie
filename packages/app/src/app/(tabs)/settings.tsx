import { useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { CircleIcon } from '../../@generic/components/circle-icon/circle-icon';
import { Page } from '../../@generic/components/page/page';
import { Separator } from '../../@generic/components/separator/separator';
import { ICONS } from '../../@generic/constant/icons.constant';
import { DefaultCurrencySelector } from '../../settings/components/default-currency-selector/default-currency-selector';
import { LocaleSelector } from '../../settings/components/locale-selector/locale-selector';
import { SettingsCard } from '../../settings/components/settings-card/settings-card';
import { SettingsGroup } from '../../settings/components/settings-group/settings-group';
import { ThemeSwitch } from '../../settings/components/theme-switch/theme-switch';

export default function SettingsPage() {
    const { t } = useLingui();

    return (
        <Page>
            <ScrollView>
                <Text className="text-primary text-6xl mb-lg">{t`Settings`}</Text>

                <Separator />

                <View className={'pt-5xl gap-y-7xl'}>
                    <SettingsGroup title={t`Privacy`}>
                        <SettingsCard
                            className="items-baseline"
                            title={t`100% Offline & Private`}
                            description={t`All your financial data is stored locally on your device. No cloud sync, no tracking, no data sharing.`}
                            left={<CircleIcon size="1_5xl" icon={ICONS.Shield} variant="positive" border={false} />}
                        />
                    </SettingsGroup>

                    <SettingsGroup title={t`General`}>
                        <ThemeSwitch />
                        <DefaultCurrencySelector />
                        <LocaleSelector />
                    </SettingsGroup>

                    <SettingsGroup title={t`About`}>
                        <SettingsCard
                            title={t`BudgetAI`}
                            className="items-baseline"
                            description={t`AI-powered budgeting app with complete privacy. All data processing happens locally on your device. \nVersion 1.0.0`}
                            left={<CircleIcon size="1_5xl" icon={ICONS.Database} variant="ghost" border={false} />}
                        />
                    </SettingsGroup>
                </View>
            </ScrollView>
        </Page>
    );
}
