import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { Page } from '../../@generic/components/page/page';
import { SettingsTextItem } from '../../@settings/components/settings-text-item/settings-text-item';
import { ThemeSwitch } from '../../@settings/components/theme-switch/theme-switch';

export default function SettingsPage() {
    const { t } = useLingui();

    return (
        <Page>
            <ScrollView>
                <Text className="text-primary text-[36px]">{t`Settings`}</Text>

                <View className={'pt-[20px] gap-y-[24px]'}>
                    <View className={'gap-y-[10px]'}>
                        <Text className={'text-[12px] uppercase text-secondary-foreground'}>
                            <Trans>Privacy</Trans>
                        </Text>

                        <SettingsTextItem
                            variant={'positive'}
                            title={t`100% Offline & Private`}
                            description={t`All your financial data is stored locally on your device. No cloud sync, no tracking, no data sharing.`}
                            icon="Shield"
                        />
                    </View>

                    <View className={'gap-y-[10px]'}>
                        <Text className={'text-[12px] uppercase text-secondary-foreground'}>
                            <Trans>General</Trans>
                        </Text>

                        <ThemeSwitch />
                    </View>
                    <View className={'gap-y-[10px]'}>
                        <Text className={'text-[12px] uppercase text-secondary-foreground'}>
                            <Trans>About</Trans>
                        </Text>

                        <SettingsTextItem
                            variant={'ghost'}
                            title={t`BudgetAI`}
                            description={t`AI-powered budgeting app with complete privacy. All data processing happens locally on your device. \nVersion 1.0.0`}
                            icon="Database"
                        />
                    </View>
                </View>
            </ScrollView>
        </Page>
    );
}
