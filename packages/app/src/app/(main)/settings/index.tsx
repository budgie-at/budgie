import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { Page } from '../../../@generic/components/page/page';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { CentsSwitch } from '../../../settings/components/cents-switch/cents-switch';
import { DefaultAccountSelector } from '../../../settings/components/default-account-selector/default-account-selector';
import { DefaultCurrencySelector } from '../../../settings/components/default-currency-selector/default-currency-selector';
import { GenericSelectorCard } from '../../../settings/components/generic-selector-card/generic-selector-card';
import { LanguageSelector } from '../../../settings/components/language-selector/language-selector';
import { LocaleSelector } from '../../../settings/components/locale-selector/locale-selector';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { ThemeSwitch } from '../../../settings/components/theme-switch/theme-switch';

export default function SettingsPage() {
    const { t } = useLingui();

    const handleNavigateToCategories = () => void router.push('/settings/categories');
    const handleNavigateToArchived = () => void router.push('/settings/archived');
    const navigateToTags = () => void router.push('/settings/tags');

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <Page
            header={
                <View className="px-5xl flex-row items-center gap-x-2xl">
                    <HapticPressable className="p-md" onPress={handleGoBack}>
                        <Icon className="text-primary" icon={ICONS.ChevronLeft} size={24} />
                    </HapticPressable>

                    <Text className="text-primary text-6xl">
                        <Trans>Settings</Trans>
                    </Text>
                </View>
            }
        >
            <ScrollView>
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
                        <DefaultAccountSelector />
                    </SettingsGroup>

                    <SettingsGroup title={t`Organization`}>
                        <GenericSelectorCard
                            onPress={handleNavigateToCategories}
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
                        <GenericSelectorCard
                            onPress={handleNavigateToArchived}
                            title={t`Archived Accounts`}
                            description={t`View and restore archived accounts`}
                            icon="Archive"
                            iconVariant="dark-warning"
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
            </ScrollView>
        </Page>
    );
}
