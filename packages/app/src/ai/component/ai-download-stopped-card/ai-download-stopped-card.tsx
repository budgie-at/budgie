import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
import { AiDownloadSelector } from '../../ai-download.selector';
import { AiModelDownloadStatusEnum } from '../../enum/ai-model-download-status.enum';
import { useAiModelDownloadActions } from '../../hook/use-ai-model-download-actions.hook';
import { useAiModelDownloadAmounts } from '../../hook/use-ai-model-download-amounts.hook';
import { AiDownloadCardFrame } from '../ai-download-card-frame/ai-download-card-frame';

export const AiDownloadStoppedCard = () => {
    const { t } = useLingui();
    const { summary, downloaded, remaining, missing, free } = useAiModelDownloadAmounts();
    const actions = useAiModelDownloadActions();

    const isNeedsSpace = summary.status === AiModelDownloadStatusEnum.NEEDS_SPACE;
    const hasDownloadedPart = isPositiveNumber(summary.downloadedBytes);
    const title = isNeedsSpace ? t`This phone needs ${missing} GB more free space.` : t`The download arrived damaged.`;
    const description = isNeedsSpace
        ? t`${free} GB is free right now. Your money data isn't affected.`
        : t`Budgie deleted the damaged part. It starts again only when you ask.`;
    const retryLabel = isNeedsSpace ? t`Try again` : t`Download ${remaining} GB again`;

    return (
        <AiDownloadCardFrame status={summary.status} testID={AiDownloadSelector.StatusCard}>
            <View className="gap-y-sm">
                <Text className="text-[17px] text-primary">{title}</Text>
                <Text className="text-[13px] leading-[18px] text-secondary-foreground">{description}</Text>
            </View>

            <View className="flex-row flex-wrap gap-md">
                <SettingsPillButton
                    testID={AiDownloadSelector.RetryButton}
                    variant="secondary"
                    label={retryLabel}
                    onPress={actions.resume}
                />
                {hasDownloadedPart ? (
                    <SettingsPillButton
                        testID={AiDownloadSelector.CancelButton}
                        variant="secondary"
                        label={t`Delete the ${downloaded} GB part`}
                        onPress={actions.cancel}
                    />
                ) : null}
            </View>
        </AiDownloadCardFrame>
    );
};
