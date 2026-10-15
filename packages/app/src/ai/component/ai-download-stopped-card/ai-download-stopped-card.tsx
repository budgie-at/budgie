import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
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
                <Text className="text-lg font-semibold text-primary">{title}</Text>
                <Text className="text-sm text-secondary-foreground">{description}</Text>
            </View>

            <View className="flex-row flex-wrap gap-md">
                <Button
                    testID={AiDownloadSelector.RetryButton}
                    size="sm"
                    variant="primary"
                    leftIcon={UserIconNameEnum.RotateCw}
                    content={retryLabel}
                    onPress={actions.resume}
                />
                {hasDownloadedPart ? (
                    <Button
                        testID={AiDownloadSelector.CancelButton}
                        size="sm"
                        variant="ghost"
                        content={t`Delete the ${downloaded} GB part`}
                        onPress={actions.cancel}
                    />
                ) : null}
            </View>
        </AiDownloadCardFrame>
    );
};
