import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { AiFeaturesSettingsCard } from '../../../ai/component/ai-features-settings-card/ai-features-settings-card';
import { RunwaySettingsRows } from '../../../runway/component/runway-settings-rows/runway-settings-rows';
import { AccountsSettingsRows } from '../../../settings/components/accounts-settings-rows/accounts-settings-rows';
import { AutoAssignMccCategory } from '../../../settings/components/auto-assign-mcc-category/auto-assign-mcc-category';
import { BudgetManagementCard } from '../../../settings/components/budget-management-card/budget-management-card';
import { BudgetPushToggle } from '../../../settings/components/budget-push-toggle/budget-push-toggle';
import { BudgetWidgetToggle } from '../../../settings/components/budget-widget-toggle/budget-widget-toggle';
import { DefaultAccountSelector } from '../../../settings/components/default-account-selector/default-account-selector';
import { DefaultCurrencySelector } from '../../../settings/components/default-currency-selector/default-currency-selector';
import { LanguageSelector } from '../../../settings/components/language-selector/language-selector';
import { OrganizeSettingsRows } from '../../../settings/components/organize-settings-rows/organize-settings-rows';
import { SecurityCard } from '../../../settings/components/security-card/security-card';
import { SettingsAboutFooter } from '../../../settings/components/settings-about-footer/settings-about-footer';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { ShowCentsRow } from '../../../settings/components/show-cents-row/show-cents-row';
import { SupportSettingsRows } from '../../../settings/components/support-settings-rows/support-settings-rows';
import { ThemeSwitch } from '../../../settings/components/theme-switch/theme-switch';
import { YourDataCard } from '../../../settings/components/your-data-card/your-data-card';
import { useScrollToAnchor } from '../../../settings/hook/use-scroll-to-anchor.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { ApplePayCaptureSettingsCard } from '../../../wallet-capture/component/apple-pay-capture-settings-card/apple-pay-capture-settings-card';

import { SettingsPageSelector } from './settings-page.selector';

const handleNavigateToData = () => void router.push('/settings/data');

// eslint-disable-next-line max-lines-per-function
export default function SettingsPage() {
    const { t } = useLingui();
    const { anchor } = useLocalSearchParams<{ anchor?: string }>();
    const { scrollViewRef, onScrollViewLayout, anchorLayout, anchorHighlight } = useScrollToAnchor(anchor);

    const lastBackupAt = useSetting('lastBackupAt');
    const dataFooter = isDefined(lastBackupAt)
        ? t`Back up regularly and after imports.`
        : t`Without a backup, lost data can't be recovered.`;
    const scrollViewProps = { ref: scrollViewRef, onLayout: onScrollViewLayout };

    return (
        <CollapsibleChromePage title={t`Settings`} testID={SettingsPageSelector.Container} scrollViewProps={scrollViewProps}>
            <View className="gap-y-5xl pb-5xl">
                <GroupedListSection title={t`Your data`} footer={dataFooter}>
                    <YourDataCard />
                    <SettingsRow
                        onPress={handleNavigateToData}
                        title={t`Data tools`}
                        subtitle={t`Import, export, repair and reset`}
                        icon={UserIconNameEnum.SlidersHorizontal}
                        variant="ghost"
                        testID={SettingsPageSelector.DataCard}
                    />
                </GroupedListSection>

                <View {...anchorLayout('security')}>
                    <Animated.View {...anchorHighlight('security')}>
                        <GroupedListSection title={t`Security`}>
                            <SecurityCard />
                        </GroupedListSection>
                    </Animated.View>
                </View>

                <View {...anchorLayout('general')}>
                    <Animated.View {...anchorHighlight('general')}>
                        <GroupedListSection title={t`General`}>
                            <LanguageSelector />
                            <DefaultCurrencySelector />
                            <DefaultAccountSelector />
                        </GroupedListSection>
                    </Animated.View>
                </View>

                <View {...anchorLayout('appearance')}>
                    <Animated.View {...anchorHighlight('appearance')}>
                        <GroupedListSection title={t`Display`}>
                            <ThemeSwitch testID={SettingsPageSelector.DarkModeCard} />
                            <ShowCentsRow />
                        </GroupedListSection>
                    </Animated.View>
                </View>

                <View {...anchorLayout('organization')}>
                    <Animated.View {...anchorHighlight('organization')}>
                        <GroupedListSection title={t`Organize`}>
                            <OrganizeSettingsRows />
                            <AccountsSettingsRows />
                        </GroupedListSection>
                    </Animated.View>
                </View>

                <View {...anchorLayout('budget')}>
                    <Animated.View {...anchorHighlight('budget')}>
                        <GroupedListSection title={t`Budget`}>
                            <BudgetManagementCard />
                            <BudgetPushToggle />
                        </GroupedListSection>
                    </Animated.View>
                </View>

                <View {...anchorLayout('runway')}>
                    <Animated.View {...anchorHighlight('runway')}>
                        <GroupedListSection title={t`Home screen`} footer={t`Include crypto also changes the Runway tab.`}>
                            <BudgetWidgetToggle />
                            <RunwaySettingsRows />
                        </GroupedListSection>
                    </Animated.View>
                </View>

                <View {...anchorLayout('ai')}>
                    <Animated.View {...anchorHighlight('ai')}>
                        <GroupedListSection title={t`Automation`}>
                            <AutoAssignMccCategory />
                            <ApplePayCaptureSettingsCard testID={SettingsPageSelector.ApplePayCaptureCard} />
                            <AiFeaturesSettingsCard />
                        </GroupedListSection>
                    </Animated.View>
                </View>

                <View>
                    <GroupedListSection title={t`Support`}>
                        <SupportSettingsRows />
                    </GroupedListSection>
                    <SettingsAboutFooter />
                </View>
                <MenuSpacer />
            </View>
        </CollapsibleChromePage>
    );
}
