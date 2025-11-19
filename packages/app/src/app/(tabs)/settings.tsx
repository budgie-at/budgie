import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AnimatedHeaderedScrollView } from '../../@generic/components/animated-headered-scroll-view/animated-headered-scroll-view';
import { CircleIcon } from '../../@generic/components/circle-icon/circle-icon';
import { Page } from '../../@generic/components/page/page';
import { Separator } from '../../@generic/components/separator/separator';
import { ICONS } from '../../@generic/constant/icons.constant';
import { CentsSwitch } from '../../settings/components/cents-switch/cents-switch';
import { DefaultCurrencySelector } from '../../settings/components/default-currency-selector/default-currency-selector';
import { GenericSelectorCard } from '../../settings/components/generic-selector-card/generic-selector-card';
import { LanguageSelector } from '../../settings/components/language-selector/language-selector';
import { LocaleSelector } from '../../settings/components/locale-selector/locale-selector';
import { SettingsCard } from '../../settings/components/settings-card/settings-card';
import { SettingsGroup } from '../../settings/components/settings-group/settings-group';
import { ThemeSwitch } from '../../settings/components/theme-switch/theme-switch';

export default function SettingsPage() {
    const { t } = useLingui();

    const navigateToCategories = () => void router.push('/(main)/categories');
    const navigateToTags = () => void router.push('/(main)/tags');

    return (
        <Page>
            <AnimatedHeaderedScrollView title={t`Settings`}>
                <Separator />

                <View className="py-5xl gap-y-7xl">
                    <SettingsGroup title={t`Privacy`}>
                        <SettingsCard
                            className="items-baseline"
                            title={t`100% Offline & Private`}
                            description={t`All your financial data is stored locally on your device. No cloud sync, no tracking, no data sharing.`}
                            left={<CircleIcon size="1_5xl" icon={ICONS.Shield} variant="positive" border={false} />}
                        />
                    </SettingsGroup>

                    <SettingsGroup title={t`General`}>
                        <LanguageSelector />
                        <DefaultCurrencySelector />
                        <LocaleSelector />
                    </SettingsGroup>

                    <SettingsGroup title={t`Organization`}>
                        <GenericSelectorCard
                            onPress={navigateToCategories}
                            title={t`Manage Categories`}
                            description={t`View and delete custom categories`}
                            icon="Folder"
                            iconVariant="default"
                        />
                        <GenericSelectorCard
                            onPress={navigateToTags}
                            title={t`Manage Tags`}
                            description={t`Create and organize transaction tags`}
                            icon="Tag"
                            iconVariant="pink"
                        />
                    </SettingsGroup>

                    <SettingsGroup title={t`Appearance`}>
                        <ThemeSwitch />
                        <CentsSwitch />
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
            </AnimatedHeaderedScrollView>
        </Page>
    );
}
