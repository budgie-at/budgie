import { useAtomValue } from '@effect/atom-react/Hooks';

import { useFormatGigabytes } from '../../@generic/hook/use-format-gigabytes.hook';
import { aiModelDownloadSummaryAtom } from '../constant/ai-model-download-summary-atom.constant';

import type { AiModelDownloadAmountsInterface } from '../interface/ai-model-download-amounts.interface';

export const useAiModelDownloadAmounts = (): AiModelDownloadAmountsInterface => {
    const formatGigabytes = useFormatGigabytes();
    const summary = useAtomValue(aiModelDownloadSummaryAtom);

    return {
        summary,
        downloaded: formatGigabytes(summary.downloadedBytes),
        total: formatGigabytes(summary.totalBytes),
        remaining: formatGigabytes(summary.remainingBytes),
        missing: formatGigabytes(summary.missingBytes),
        free: formatGigabytes(summary.freeBytes)
    };
};
