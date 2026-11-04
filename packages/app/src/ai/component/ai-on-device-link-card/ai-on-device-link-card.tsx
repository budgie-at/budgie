import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { AiDownloadSelector } from '../../ai-download.selector';
import { AI_DOWNLOAD_CARD_VISUALS } from '../../constant/ai-download-card-visuals.constant';
import { useAiModelDownloadAmounts } from '../../hook/use-ai-model-download-amounts.hook';

const handlePress = () => void router.push('/settings/ai');

export const AiOnDeviceLinkCard = () => {
    const { t } = useLingui();
    const { summary, downloaded, total } = useAiModelDownloadAmounts();

    const { icon, label } = AI_DOWNLOAD_CARD_VISUALS[summary.status];
    const statusLabel = t(label);

    return (
        <GroupedListRow
            testID={AiDownloadSelector.LinkCard}
            title={t`Models and downloads`}
            subtitle={t`${statusLabel} · ${downloaded} of ${total} GB`}
            left={<GroupedListIcon icon={icon} />}
            onPress={handlePress}
        />
    );
};
