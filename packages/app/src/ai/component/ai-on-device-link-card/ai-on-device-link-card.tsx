import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { AiDownloadSelector } from '../../ai-download.selector';
import { AI_DOWNLOAD_CARD_VISUALS } from '../../constant/ai-download-card-visuals.constant';
import { useAiModelDownloadAmounts } from '../../hook/use-ai-model-download-amounts.hook';

const handlePress = () => void router.push('/settings/ai');

export const AiOnDeviceLinkCard = () => {
    const { t } = useLingui();
    const { summary, downloaded, total } = useAiModelDownloadAmounts();

    const { icon, variant, label } = AI_DOWNLOAD_CARD_VISUALS[summary.status];
    const statusLabel = t(label);

    return (
        <SettingsCard
            testID={AiDownloadSelector.LinkCard}
            title={t`Models and downloads`}
            description={t`${statusLabel} · ${downloaded} of ${total} GB`}
            icon={icon}
            variant={variant}
            onPress={handlePress}
        />
    );
};
