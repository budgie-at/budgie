import { t } from '@lingui/core/macro';
import { ReactNode } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { AiStatusContext, AiStatusContextInterface } from '../context/ai-status.context';
import { useAiDataPreparation } from '../hook/use-ai-data-preparation.hook';

interface Props {
    readonly children: ReactNode;
}

interface AiStatusLabelAndProgressInterface {
    readonly statusLabel: string;
    readonly brainProgress: number;
}

interface ComputeStatusParams {
    readonly isRunning: boolean;
    readonly phaseLabel: string;
    readonly progress: number;
    readonly isLlmReady: boolean;
    readonly isLlmInitializing: boolean;
    readonly completionRatio: number;
    readonly downloadPercent: number;
    readonly totalContexts: number;
}

const FULL_PROGRESS = 100;

const computeStatusLabelAndProgress = (params: ComputeStatusParams): AiStatusLabelAndProgressInterface => {
    const { isRunning, phaseLabel, progress, isLlmReady, isLlmInitializing, completionRatio, downloadPercent, totalContexts } = params;

    if (isRunning) {
        return { statusLabel: phaseLabel, brainProgress: progress };
    }

    if (isLlmReady && isPositiveNumber(totalContexts)) {
        return { statusLabel: t`${completionRatio}% learned`, brainProgress: completionRatio };
    }

    if (isLlmReady) {
        return { statusLabel: t`Long press to learn`, brainProgress: 0 };
    }

    if (isLlmInitializing) {
        return { statusLabel: t`Initializing AI model...`, brainProgress: downloadPercent };
    }

    return { statusLabel: t`Downloading AI model...`, brainProgress: downloadPercent };
};

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

    const { statusLabel, brainProgress } = computeStatusLabelAndProgress({
        isRunning,
        phaseLabel,
        progress,
        isLlmReady,
        isLlmInitializing,
        completionRatio,
        downloadPercent,
        totalContexts
    });

    const value: AiStatusContextInterface = { statusLabel, brainProgress, isRunning, isLlmReady, start, startFresh };

    return <AiStatusContext value={value}>{children}</AiStatusContext>;
};
