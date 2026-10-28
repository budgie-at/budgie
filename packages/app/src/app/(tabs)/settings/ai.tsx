import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text } from 'react-native';

import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { Page } from '../../../@generic/component/page/page';
import { AiDownloadSelector } from '../../../ai/ai-download.selector';
import { AiDownloadStatusCard } from '../../../ai/component/ai-download-status-card/ai-download-status-card';
import { aiModelDownloadSummaryAtom } from '../../../ai/constant/ai-model-download-summary-atom.constant';
import { AiModelDownloadStatusEnum } from '../../../ai/enum/ai-model-download-status.enum';
import { SettingSwitch } from '../../../settings/components/setting-switch/setting-switch';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useSettingToggle } from '../../../settings/hook/use-setting-toggle.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';

export default function AiSettingsPage() {
    const { t } = useLingui();
    const isAiWifiOnly = useSetting('isAiWifiOnly');
    const { status } = useAtomValue(aiModelDownloadSummaryAtom);
    const persistWifiOnly = useSettingToggle('isAiWifiOnly', t`Could not update the download setting`);

    const handleWifiOnlyChange = (next: boolean) => void persistWifiOnly(next);

    const isReady = status === AiModelDownloadStatusEnum.READY;
    const runsOnSlot = (
        <Text className="text-sm text-secondary-foreground">
            <Trans>This phone only</Trans>
        </Text>
    );
    const wifiOnlySlot = (
        <SettingSwitch
            value={isAiWifiOnly}
            onValueChange={handleWifiOnlyChange}
            testID={AiDownloadSelector.WifiOnlySwitch}
            stateOnTestID={AiDownloadSelector.WifiOnlySwitchStateOn}
            stateOffTestID={AiDownloadSelector.WifiOnlySwitchStateOff}
        />
    );

    return (
        <Page testID={AiDownloadSelector.Page} header={<PageHeader title={t`On-device AI`} onGoBack={goBackToSettings} />}>
            <ScrollView className="flex-1" contentContainerClassName="gap-y-xl pb-5xl pt-3xl" showsVerticalScrollIndicator={false}>
                <AiDownloadStatusCard />

                <SettingsCard
                    testID={AiDownloadSelector.WifiOnlyCard}
                    icon={UserIconNameEnum.Wifi}
                    variant="cyan"
                    title={t`Download only on Wi-Fi`}
                    right={wifiOnlySlot}
                />
                <SettingsCard icon={UserIconNameEnum.Smartphone} variant="positive" title={t`Runs on`} right={runsOnSlot} />

                {isReady ? null : (
                    <Text className="text-sm text-secondary-foreground px-xl">
                        <Trans>
                            Keep using Budgie meanwhile. Until the model is ready, categories come from simple rules on the phone.
                        </Trans>
                    </Text>
                )}
                <Text className="text-sm text-secondary-foreground px-xl">
                    <Trans>If a download arrives damaged, Budgie deletes it and asks before starting again.</Trans>
                </Text>
            </ScrollView>
        </Page>
    );
}
