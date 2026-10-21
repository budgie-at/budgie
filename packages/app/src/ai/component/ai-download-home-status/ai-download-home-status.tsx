import { useAtomValue } from '@effect/atom-react/Hooks';

import { aiModelDownloadSummaryAtom } from '../../constant/ai-model-download-summary-atom.constant';
import { AiModelDownloadStatusEnum } from '../../enum/ai-model-download-status.enum';
import { AiDownloadHomeRow } from '../ai-download-home-row/ai-download-home-row';
import { AiDownloadWifiBanner } from '../ai-download-wifi-banner/ai-download-wifi-banner';

export const AiDownloadHomeStatus = () => {
    const { status, isNoticeDismissed } = useAtomValue(aiModelDownloadSummaryAtom);

    if (status === AiModelDownloadStatusEnum.WAITING_FOR_WIFI && !isNoticeDismissed) {
        return <AiDownloadWifiBanner />;
    }

    return status === AiModelDownloadStatusEnum.DOWNLOADING ? <AiDownloadHomeRow /> : null;
};
