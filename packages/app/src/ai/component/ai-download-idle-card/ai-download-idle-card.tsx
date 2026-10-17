import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { useFormatGigabytes } from '../../../@generic/hook/use-format-gigabytes.hook';
import { AiDownloadSelector } from '../../ai-download.selector';
import { AiModelDownloadStatusEnum } from '../../enum/ai-model-download-status.enum';
import { useAiDownloadPreflight } from '../../hook/use-ai-download-preflight.hook';
import { useAiModelDownloadActions } from '../../hook/use-ai-model-download-actions.hook';
import { AiDownloadCardFrame } from '../ai-download-card-frame/ai-download-card-frame';
import { AiDownloadPreflightNote } from '../ai-download-preflight-note/ai-download-preflight-note';

export const AiDownloadIdleCard = () => {
    const { t } = useLingui();
    const formatGigabytes = useFormatGigabytes();
    const preflight = useAiDownloadPreflight();
    const actions = useAiModelDownloadActions();

    const remaining = formatGigabytes(preflight.remainingBytes);
    const total = formatGigabytes(preflight.totalBytes);
    const isDownloadDisabled = !preflight.hasEnoughSpace;

    if (preflight.status === AiModelDownloadStatusEnum.NOT_STARTED) {
        return (
            <AiDownloadCardFrame status={preflight.status} testID={AiDownloadSelector.StatusCard}>
                <View className="gap-y-sm">
                    <Text className="text-lg font-semibold text-primary">
                        <Trans>{remaining} GB one-time download</Trans>
                    </Text>
                    <AiDownloadPreflightNote preflight={preflight} />
                </View>

                <Button
                    testID={AiDownloadSelector.DownloadButton}
                    size="sm"
                    variant="primary"
                    className="self-start"
                    leftIcon={UserIconNameEnum.Download}
                    content={t`Download ${remaining} GB`}
                    disabled={isDownloadDisabled}
                    onPress={actions.resume}
                />
            </AiDownloadCardFrame>
        );
    }

    const isReady = preflight.status === AiModelDownloadStatusEnum.READY;
    const description = isReady
        ? t`Categories, tags and voice notes are handled on this phone.`
        : t`Turn on on-device AI to download the models.`;

    return (
        <AiDownloadCardFrame status={preflight.status} testID={AiDownloadSelector.StatusCard}>
            <View className="gap-y-sm">
                {isReady ? (
                    <Text className="text-lg font-semibold text-primary">
                        <Trans>{total} GB on this phone</Trans>
                    </Text>
                ) : null}
                <Text className="text-sm text-secondary-foreground">{description}</Text>
            </View>
        </AiDownloadCardFrame>
    );
};
