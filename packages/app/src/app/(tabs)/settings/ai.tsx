import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { isAiEnabled } from '../../../@generic/utils/is-ai-enabled.util';
import { AiDownloadSelector } from '../../../ai/ai-download.selector';
import { AiDownloadStatusCard } from '../../../ai/component/ai-download-status-card/ai-download-status-card';
import { aiModelDownloadSummaryAtom } from '../../../ai/constant/ai-model-download-summary-atom.constant';
import { AiModelDownloadStatusEnum } from '../../../ai/enum/ai-model-download-status.enum';
import { SettingSwitch } from '../../../settings/components/setting-switch/setting-switch';
import { useSettingToggle } from '../../../settings/hook/use-setting-toggle.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';

export default function AiSettingsPage() {
    const { t } = useLingui();
    const isAiWifiOnly = useSetting('isAiWifiOnly');
    const { status } = useAtomValue(aiModelDownloadSummaryAtom);
    const persistWifiOnly = useSettingToggle('isAiWifiOnly', t`Could not update the download setting`);
    const handleWifiOnlyChange = (next: boolean) => void persistWifiOnly(next);
    const handleEnableAi = () => void router.push('/settings/ai-features');
    const isDisabled = status === AiModelDownloadStatusEnum.DISABLED;
    const isAiBuildEnabled = isAiEnabled();
    const canEnableAi = isDisabled || !isAiBuildEnabled;
    const wifiClassName = isDisabled ? 'opacity-40' : '';
    const downloadFooter =
        status === AiModelDownloadStatusEnum.READY
            ? t`If a download arrives damaged, Budgie deletes it and waits for you to retry.`
            : t`Until the model is ready, categories come from simple rules on this phone. If a download arrives damaged, Budgie deletes it and waits for you to retry.`;
    const footer = isDisabled ? t`Available when on-device AI is on.` : downloadFooter;
    const wifiStateTestID = isAiWifiOnly ? AiDownloadSelector.WifiOnlySwitchStateOn : AiDownloadSelector.WifiOnlySwitchStateOff;
    const wifiOnlySlot = isDisabled ? (
        <View className="flex-row items-center gap-x-xs">
            <View testID={wifiStateTestID} className="h-1 w-1" />
            <ThemedSwitch
                disabled
                value={false}
                testID={AiDownloadSelector.WifiOnlySwitch}
                accessibilityLabel={t`Download only on Wi-Fi`}
            />
        </View>
    ) : (
        <SettingSwitch
            value={isAiWifiOnly}
            onValueChange={handleWifiOnlyChange}
            testID={AiDownloadSelector.WifiOnlySwitch}
            stateOnTestID={AiDownloadSelector.WifiOnlySwitchStateOn}
            stateOffTestID={AiDownloadSelector.WifiOnlySwitchStateOff}
            accessibilityLabel={t`Download only on Wi-Fi`}
        />
    );

    return (
        <GroupedSurface>
            <CollapsibleChromePage
                scrimClassName="bg-surface"
                title={t`On-device AI`}
                leading={<GoBackButton onPress={goBackToSettings} />}
                testID={AiDownloadSelector.Page}
            >
                <View className="gap-y-7xl pb-5xl">
                    <GroupedListSection>
                        <AiDownloadStatusCard />
                        {canEnableAi ? <GroupedListRow title={t`AI features`} onPress={handleEnableAi} /> : null}
                    </GroupedListSection>
                    {isAiBuildEnabled ? (
                        <GroupedListSection title={t`Download`} footer={footer}>
                            <View className={wifiClassName}>
                                <GroupedListRow
                                    testID={AiDownloadSelector.WifiOnlyCard}
                                    left={<GroupedListIcon icon={UserIconNameEnum.Wifi} />}
                                    title={t`Download only on Wi-Fi`}
                                    right={wifiOnlySlot}
                                />
                            </View>
                            <GroupedListRow
                                title={t`Runs on`}
                                left={<GroupedListIcon icon={UserIconNameEnum.Smartphone} />}
                                right={
                                    <Text className="text-[17px] text-secondary-foreground">
                                        <Trans>This phone only</Trans>
                                    </Text>
                                }
                            />
                        </GroupedListSection>
                    ) : null}
                    <MenuSpacer />
                </View>
            </CollapsibleChromePage>
        </GroupedSurface>
    );
}
