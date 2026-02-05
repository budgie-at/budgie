import { SettingsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { ExportCsv } from '../../../export/components/export-csv/export-csv';
import { ExportDatabase } from '../../../export/components/export-database/export-database';
import { ImportCsv } from '../../../import/components/import-csv/import-csv';
import { ImportDatabase } from '../../../import/components/import-database/import-database';
import { ConsolidateTransfers } from '../../../settings/components/consolidate-transfers/consolidate-transfers';
import { DefaultAccountSelector } from '../../../settings/components/default-account-selector/default-account-selector';
import { DefaultCurrencySelector } from '../../../settings/components/default-currency-selector/default-currency-selector';
import { LanguageSelector } from '../../../settings/components/language-selector/language-selector';
import { RecalculateBalances } from '../../../settings/components/recalculate-balances/recalculate-balances';
import { RegenerateCategories } from '../../../settings/components/regenerate-categories/regenerate-categories';
import { PinCard } from '../../../settings/components/security-settings/pin-card';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { ThemeSwitch } from '../../../settings/components/theme-switch/theme-switch';
import { TruncateData } from '../../../settings/components/truncate-data/truncate-data';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';

// eslint-disable-next-line max-lines-per-function
export default function SettingsPage() {
    const { t } = useLingui();

    const isScreenshotProtectionEnabled = useSetting('isScreenshotProtectionEnabled');
    const showCents = useSetting('showCents');

    const handleNavigateToCategories = () => void router.push('/settings/categories');
    const handleNavigateToArchived = () => void router.push('/settings/archived');
    const handleNavigateToInactive = () => void router.push('/settings/inactive');
    const handleNavigateToTags = () => void router.push('/settings/tags');

    const handleToggle = (key: keyof SettingsEntityInterface) => async (checked: boolean) => {
        await updateSettingsMutation({ [key]: checked });
    };

    const appVersion = Constants.expoConfig?.version ?? '1.0.0';

    return (
        <Page header={<PageHeader className="border-b-0" size="md" title={t`Settings`} />} withBlur>
            <ScrollView showsVerticalScrollIndicator={false}>
                <MenuSpacer multiplier={0.05}></MenuSpacer>
                <View className="py-5xl gap-y-7xl">
                    <SettingsGroup title={t`Privacy`}>
                        <SimpleHorizontalCell
                            left={<CircleIcon icon={UserIconNameEnum.Shield} variant="positive" border={false} size={40} iconSize={20} />}
                            title={t`100% Offline & Private`}
                            description={t`All your financial data is stored locally on your device. No cloud sync, no tracking, no data sharing.`}
                        />
                    </SettingsGroup>

                    <SettingsGroup title={t`Security`}>
                        <PinCard />
                        <SettingsCard
                            icon={UserIconNameEnum.ShieldCheck}
                            variant="pink"
                            title={t`Screenshot Protection`}
                            description={t`Hide account balances and net worth when taking screenshots`}
                            right={
                                <ThemedSwitch
                                    className="my-auto"
                                    onValueChange={handleToggle('isScreenshotProtectionEnabled')}
                                    value={isScreenshotProtectionEnabled}
                                />
                            }
                        />
                    </SettingsGroup>

                    <SettingsGroup title={t`General`}>
                        <LanguageSelector />
                        <DefaultCurrencySelector />
                        <DefaultAccountSelector />
                    </SettingsGroup>

                    <SettingsGroup title={t`Organization`}>
                        <SettingsCard
                            onPress={handleNavigateToCategories}
                            title={t`Manage Categories`}
                            description={t`View and delete custom categories`}
                            icon={UserIconNameEnum.Folder}
                            variant="default"
                        />
                        <SettingsCard
                            onPress={handleNavigateToTags}
                            title={t`Manage Tags`}
                            description={t`Create and organize transaction tags`}
                            icon={UserIconNameEnum.Tag}
                            variant="pink"
                        />
                        <SettingsCard
                            onPress={handleNavigateToArchived}
                            title={t`Archived Accounts`}
                            description={t`View and restore archived accounts`}
                            icon={UserIconNameEnum.Archive}
                            variant="dark-warning"
                        />
                        <SettingsCard
                            onPress={handleNavigateToInactive}
                            title={t`Inactive Accounts`}
                            description={t`View and activate hidden accounts`}
                            icon={UserIconNameEnum.EyeOff}
                            variant="dark-warning"
                        />
                    </SettingsGroup>

                    <SettingsGroup title={t`Appearance`}>
                        <ThemeSwitch />
                        <SettingsCard
                            title={t`Show Cents`}
                            description={t`Show $1,234.56 instead of $1,235`}
                            icon={UserIconNameEnum.DollarSign}
                            right={<ThemedSwitch className="my-auto" onValueChange={handleToggle('showCents')} value={showCents} />}
                            variant="positive"
                        />
                    </SettingsGroup>

                    <SettingsGroup title={t`Data management`}>
                        <ImportCsv />
                        <ExportCsv />
                        <ImportDatabase />
                        <ExportDatabase />
                        <RecalculateBalances />
                        <RegenerateCategories />
                        <ConsolidateTransfers />
                        <TruncateData />
                    </SettingsGroup>

                    <SettingsGroup title={t`About`}>
                        <SettingsCard
                            align="top"
                            title={t`Budgie`}
                            className="items-baseline"
                            description={t`AI-powered budgeting app with complete privacy. All data processing happens locally on your device.\nVersion ${appVersion}`}
                            icon={UserIconNameEnum.Database}
                            variant="ghost"
                        />
                    </SettingsGroup>

                    <MenuSpacer />
                </View>
            </ScrollView>
        </Page>
    );
}
