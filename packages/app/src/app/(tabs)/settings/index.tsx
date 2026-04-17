import { SettingsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useScrollToRef } from '../../../@generic/hook/use-scroll-to-ref.hook';
import { isAiEnabled } from '../../../@generic/utils/is-ai-enabled.util';
import { ExportCsv } from '../../../export/components/export-csv/export-csv';
import { ExportDatabase } from '../../../export/components/export-database/export-database';
import { ImportCsv } from '../../../import/components/import-csv/import-csv';
import { ImportDatabase } from '../../../import/components/import-database/import-database';
import { AiDataCard } from '../../../settings/components/ai-data-card/ai-data-card';
import { DefaultAccountSelector } from '../../../settings/components/default-account-selector/default-account-selector';
import { DefaultCurrencySelector } from '../../../settings/components/default-currency-selector/default-currency-selector';
import { LanguageSelector } from '../../../settings/components/language-selector/language-selector';
import { RecalculateBalances } from '../../../settings/components/recalculate-balances/recalculate-balances';
import { PinCard } from '../../../settings/components/security-settings/pin-card';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { ThemeSwitch } from '../../../settings/components/theme-switch/theme-switch';
import { TruncateData } from '../../../settings/components/truncate-data/truncate-data';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';

import { SettingsPageSelector } from './settings-page.selector';

// eslint-disable-next-line max-lines-per-function
export default function SettingsPage() {
    const { t } = useLingui();
    const { scrollViewRef, anchorLayout, anchorHighlight } = useScrollToRef();

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
    const aiEnabled = isAiEnabled();

    return (
        <Page testID={SettingsPageSelector.Container} header={<PageHeader className="border-b-0" size="md" title={t`Settings`} />} withBlur>
            <ScrollView ref={scrollViewRef} contentContainerClassName="gap-y-7xl pt-16 pb-5xl" showsVerticalScrollIndicator={false}>
                <SettingsGroup title={t`Privacy`}>
                    <SimpleHorizontalCell
                        left={<CircleIcon icon={UserIconNameEnum.Shield} variant="positive" border={false} size={40} iconSize={20} />}
                        title={t`100% Offline & Private`}
                        description={t`All your financial data is stored locally on your device. No cloud sync, no tracking, no data sharing.`}
                    />
                </SettingsGroup>

                <View {...anchorLayout('security')}>
                    <SettingsGroup title={t`Security`}>
                        <Animated.View className="gap-y-lg" {...anchorHighlight('security')}>
                            <PinCard />
                            <SettingsCard
                                icon={UserIconNameEnum.ShieldCheck}
                                variant="pink"
                                title={t`Screenshot Protection`}
                                description={t`Hide account balances and net worth when taking screenshots`}
                                testID={SettingsPageSelectors.ScreenshotProtectionCard}
                                right={
                                    <ThemedSwitch
                                        className="my-auto"
                                        testID={SettingsPageSelectors.ScreenshotProtectionSwitch}
                                        onValueChange={handleToggle('isScreenshotProtectionEnabled')}
                                        value={isScreenshotProtectionEnabled}
                                    />
                                }
                            />
                        </Animated.View>
                    </SettingsGroup>
                </View>

                <View {...anchorLayout('general')}>
                    <SettingsGroup title={t`General`}>
                        <Animated.View className="gap-y-lg" {...anchorHighlight('general')}>
                            <LanguageSelector />
                            <DefaultCurrencySelector />
                            <DefaultAccountSelector />
                        </Animated.View>
                    </SettingsGroup>
                </View>

                {aiEnabled ? (
                    <View {...anchorLayout('ai')}>
                        <SettingsGroup title={t`AI`}>
                            <Animated.View className="gap-y-lg" {...anchorHighlight('ai')}>
                                <AiDataCard />
                            </Animated.View>
                        </SettingsGroup>
                    </View>
                ) : null}

                <View {...anchorLayout('organization')}>
                    <SettingsGroup title={t`Organization`}>
                        <Animated.View className="gap-y-lg" {...anchorHighlight('organization')}>
                            <SettingsCard
                                onPress={handleNavigateToCategories}
                                title={t`Manage Categories`}
                                description={t`View and delete custom categories`}
                                icon={UserIconNameEnum.Folder}
                                variant="default"
                                testID={SettingsPageSelector.ManageCategoriesCard}
                            />
                            <SettingsCard
                                onPress={handleNavigateToTags}
                                title={t`Manage Tags`}
                                description={t`Create and organize transaction tags`}
                                icon={UserIconNameEnum.Tag}
                                variant="pink"
                                testID={SettingsPageSelector.ManageTagsCard}
                            />
                            <SettingsCard
                                onPress={handleNavigateToArchived}
                                title={t`Archived Accounts`}
                                description={t`View and restore archived accounts`}
                                icon={UserIconNameEnum.Archive}
                                variant="dark-warning"
                                testID={SettingsPageSelector.ArchivedCard}
                            />
                            <SettingsCard
                                onPress={handleNavigateToInactive}
                                title={t`Inactive Accounts`}
                                description={t`View and activate hidden accounts`}
                                icon={UserIconNameEnum.EyeOff}
                                variant="dark-warning"
                                testID={SettingsPageSelector.InactiveCard}
                            />
                        </Animated.View>
                    </SettingsGroup>
                </View>

                <View {...anchorLayout('appearance')}>
                        <SettingsGroup title={t`Appearance`}>
                        <Animated.View className="gap-y-lg" {...anchorHighlight('appearance')}>
                            <ThemeSwitch
                                cardTestID={SettingsPageSelector.DarkModeCard}
                                switchTestID={SettingsPageSelector.DarkModeSwitch}
                            />
                            <SettingsCard
                                testID={SettingsPageSelector.ShowCentsCard}
                                title={t`Show Cents`}
                                description={t`Show $1,234.56 instead of $1,235`}
                                icon={UserIconNameEnum.DollarSign}
                                right={
                                    <ThemedSwitch
                                        className="my-auto"
                                        testID={SettingsPageSelector.ShowCentsSwitch}
                                        onValueChange={handleToggle('showCents')}
                                        value={showCents}
                                    />
                                }
                                variant="positive"
                            />
                        </Animated.View>
                    </SettingsGroup>
                </View>

                <View {...anchorLayout('data')}>
                    <SettingsGroup title={t`Data management`}>
                        <Animated.View className="gap-y-lg" {...anchorHighlight('data')}>
                            <ImportCsv />
                            <ExportCsv />
                            <ImportDatabase />
                            <ExportDatabase />
                            <RecalculateBalances />
                            <Animated.View {...anchorLayout('clear-data')} {...anchorHighlight('clear-data')}>
                                <TruncateData />
                            </Animated.View>
                        </Animated.View>
                    </SettingsGroup>
                </View>

                <SettingsGroup title={t`About`}>
                    <Card variant="ghost" className="items-center gap-y-3xl">
                        <Text className="text-primary text-base font-medium text-center">{t`Budgie`}</Text>
                        <Text className="text-secondary-foreground text-sm text-center">
                            {t`AI-powered budgeting app with complete privacy. All data processing happens locally on your device.`}
                        </Text>
                        <View className="self-stretch h-px bg-secondary-corner" />
                        <View className="items-center gap-y-xs">
                            <Text className="text-secondary-foreground text-xs uppercase tracking-wide">{t`App Version`}</Text>
                            <Text className="text-primary text-sm font-semibold">{appVersion}</Text>
                        </View>
                    </Card>
                </SettingsGroup>
                <MenuSpacer />
            </ScrollView>
        </Page>
    );
}
