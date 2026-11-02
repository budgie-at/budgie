import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useFormatGigabytes } from '../../../@generic/hook/use-format-gigabytes.hook';
import { isAiEnabled } from '../../../@generic/utils/is-ai-enabled.util';
import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
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
    const handleDownload = preflight.hasEnoughSpace ? actions.resume : void 0;

    if (preflight.status === AiModelDownloadStatusEnum.NOT_STARTED) {
        return (
            <AiDownloadCardFrame
                status={preflight.status}
                testID={AiDownloadSelector.StatusCard}
                subtitle={t`${remaining} GB one-time download`}
            >
                <View className="gap-y-sm">
                    <AiDownloadPreflightNote preflight={preflight} />
                </View>

                <SettingsPillButton
                    testID={AiDownloadSelector.DownloadButton}
                    variant="secondary"
                    label={t`Download ${remaining} GB`}
                    onPress={handleDownload}
                />
            </AiDownloadCardFrame>
        );
    }

    const isReady = preflight.status === AiModelDownloadStatusEnum.READY;
    const description = isReady
        ? t`Categories, tags and voice notes are handled on this phone.`
        : t`Turn on on-device AI to download the models.`;
    const subtitle = isAiEnabled() ? description : t`Not available in this version`;

    return (
        <AiDownloadCardFrame status={preflight.status} testID={AiDownloadSelector.StatusCard} subtitle={subtitle}>
            {isReady ? (
                <Text className="text-[17px] text-primary">
                    <Trans>{total} GB on this phone</Trans>
                </Text>
            ) : null}
        </AiDownloadCardFrame>
    );
};
