import { useAtomValue } from '@effect/atom-react/Hooks';

import { aiModelDownloadSummaryAtom } from '../../constant/ai-model-download-summary-atom.constant';
import { AiModelDownloadStatusEnum } from '../../enum/ai-model-download-status.enum';
import { AiDownloadIdleCard } from '../ai-download-idle-card/ai-download-idle-card';
import { AiDownloadProgressCard } from '../ai-download-progress-card/ai-download-progress-card';
import { AiDownloadStoppedCard } from '../ai-download-stopped-card/ai-download-stopped-card';

const STOPPED_STATUSES = new Set([AiModelDownloadStatusEnum.NEEDS_SPACE, AiModelDownloadStatusEnum.DAMAGED]);
const IDLE_STATUSES = new Set([AiModelDownloadStatusEnum.NOT_STARTED, AiModelDownloadStatusEnum.READY, AiModelDownloadStatusEnum.DISABLED]);

export const AiDownloadStatusCard = () => {
    const { status } = useAtomValue(aiModelDownloadSummaryAtom);

    if (STOPPED_STATUSES.has(status)) {
        return <AiDownloadStoppedCard />;
    }

    if (IDLE_STATUSES.has(status)) {
        return <AiDownloadIdleCard />;
    }

    return <AiDownloadProgressCard />;
};
