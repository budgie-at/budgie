import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';
import { AiDownloadSelector } from '../../ai-download.selector';
import { AiModelDownloadStatusEnum } from '../../enum/ai-model-download-status.enum';
import { useAiModelDownloadActions } from '../../hook/use-ai-model-download-actions.hook';
import { useAiModelDownloadAmounts } from '../../hook/use-ai-model-download-amounts.hook';
import { AiDownloadCardFrame } from '../ai-download-card-frame/ai-download-card-frame';
import { AiDownloadEta } from '../ai-download-eta/ai-download-eta';

export const AiDownloadProgressCard = () => {
    const { t } = useLingui();
    const { summary, downloaded, total, remaining } = useAiModelDownloadAmounts();
    const actions = useAiModelDownloadActions();

    const isDownloading = summary.status === AiModelDownloadStatusEnum.DOWNLOADING;
    const canResume = summary.status === AiModelDownloadStatusEnum.PAUSED || summary.status === AiModelDownloadStatusEnum.FAILED;
    const isWaitingForWifi = summary.status === AiModelDownloadStatusEnum.WAITING_FOR_WIFI;
    const captions: Partial<Record<AiModelDownloadStatusEnum, string>> = {
        [AiModelDownloadStatusEnum.PAUSED]: t`Paused. ${downloaded} of ${total} GB is kept.`,
        [AiModelDownloadStatusEnum.WAITING_FOR_WIFI]: t`${downloaded} of ${total} GB is kept. It carries on when you're back on Wi-Fi.`,
        [AiModelDownloadStatusEnum.WAITING_FOR_NETWORK]: t`${downloaded} of ${total} GB is kept. It carries on when you're back online.`,
        [AiModelDownloadStatusEnum.FAILED]: t`The download stopped before it finished. Try again when the connection is stable.`
    };
    const resumeLabel = summary.status === AiModelDownloadStatusEnum.FAILED ? t`Try again` : t`Resume`;

    return (
        <AiDownloadCardFrame status={summary.status} testID={AiDownloadSelector.StatusCard}>
            <View className="flex-row items-baseline gap-x-sm">
                <Text className="text-4xl font-semibold text-primary">{downloaded}</Text>
                <Text className="text-md text-secondary-foreground">
                    <Trans>of {total} GB</Trans>
                </Text>
            </View>

            <AiProgressBar progress={summary.percent} />

            {isDownloading ? (
                <AiDownloadEta etaSeconds={summary.etaSeconds} />
            ) : (
                <Text className="text-sm text-secondary-foreground">{captions[summary.status]}</Text>
            )}

            <View className="flex-row flex-wrap gap-md">
                {isDownloading ? (
                    <Button
                        testID={AiDownloadSelector.PauseButton}
                        size="sm"
                        variant="primary"
                        leftIcon={UserIconNameEnum.Pause}
                        content={t`Pause`}
                        onPress={actions.pause}
                    />
                ) : null}
                {canResume ? (
                    <Button
                        testID={AiDownloadSelector.ResumeButton}
                        size="sm"
                        variant="primary"
                        leftIcon={UserIconNameEnum.Play}
                        content={resumeLabel}
                        onPress={actions.resume}
                    />
                ) : null}
                {isWaitingForWifi ? (
                    <Button
                        testID={AiDownloadSelector.MobileDataButton}
                        size="sm"
                        variant="primary"
                        content={t`Use mobile data for ${remaining} GB`}
                        onPress={actions.allowMobileData}
                    />
                ) : null}
                <Button
                    testID={AiDownloadSelector.CancelButton}
                    size="sm"
                    variant="ghost"
                    content={t`Cancel and delete`}
                    onPress={actions.cancel}
                />
            </View>
        </AiDownloadCardFrame>
    );
};
