import { useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { Page } from '../../@generic/components/page/page';
import { Separator } from '../../@generic/components/separator/separator';
import { SettingsGroup } from '../../@settings/components/settings-group/settings-group';
import { SettingsTextItem } from '../../@settings/components/settings-text-item/settings-text-item';
import { ThemeSwitch } from '../../@settings/components/theme-switch/theme-switch';

export default function SettingsPage() {
    const { t } = useLingui();

    return (
        <Page>
            <ScrollView>
                <Text className="text-primary text-6xl mb-lg">{t`Settings`}</Text>

                <Separator />

                <View className={'pt-5xl gap-y-7xl'}>
                    <SettingsGroup title={t`Privacy`}>
                        <SettingsTextItem
                            variant={'positive'}
                            title={t`100% Offline & Private`}
                            description={t`All your financial data is stored locally on your device. No cloud sync, no tracking, no data sharing.`}
                            icon="Shield"
                        />
                    </SettingsGroup>

                    <SettingsGroup title={t`General`}>
                        <ThemeSwitch />
                    </SettingsGroup>

                    <SettingsGroup title={t`About`}>
                        <SettingsTextItem
                            variant={'ghost'}
                            title={t`BudgetAI`}
                            description={t`AI-powered budgeting app with complete privacy. All data processing happens locally on your device. \nVersion 1.0.0`}
                            icon="Database"
                        />
                    </SettingsGroup>
                </View>
            </ScrollView>
        </Page>
    );
}
