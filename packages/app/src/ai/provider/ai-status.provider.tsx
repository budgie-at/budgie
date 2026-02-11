import { t } from '@lingui/core/macro';
import { ReactNode } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { AiStatusContext, AiStatusContextInterface } from '../context/ai-status.context';
import { useAiDataPreparation } from '../hook/use-ai-data-preparation.hook';

interface Props {
    readonly children: ReactNode;
}

const FULL_PROGRESS = 100;

// eslint-disable-next-line max-statements -- Provider computing unified AI status from multiple sources
export const AiStatusProvider = ({ children }: Props) => {
    const {
        start,
        startFresh,
        isRunning,
        progress,
        phaseLabel,
        embeddedCount,
        totalContexts,
        isLlmReady,
        isLlmInitializing,
        llmDownloadProgress
    } = useAiDataPreparation();

    const completionRatio = isPositiveNumber(totalContexts) ? Math.round((embeddedCount / totalContexts) * FULL_PROGRESS) : 0;
    const downloadPercent = Math.round(llmDownloadProgress * FULL_PROGRESS);

    let statusLabel: string;
    let brainProgress: number;

    if (isRunning) {
        statusLabel = phaseLabel;
        brainProgress = progress;
    } else if (isLlmReady && isPositiveNumber(totalContexts)) {
        statusLabel = t`${completionRatio}% learned`;
        brainProgress = completionRatio;
    } else if (isLlmReady) {
        statusLabel = t`Ready to learn`;
        brainProgress = 0;
    } else if (isLlmInitializing) {
        statusLabel = t`Initializing AI model...`;
        brainProgress = downloadPercent;
    } else {
        statusLabel = t`Downloading AI model...`;
        brainProgress = downloadPercent;
    }

    const value: AiStatusContextInterface = { statusLabel, brainProgress, isRunning, isLlmReady, start, startFresh };

    return <AiStatusContext value={value}>{children}</AiStatusContext>;
};
