import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { AiBrainProgress } from '../../../ai/component/ai-brain-progress/ai-brain-progress';
import { useAiDataPreparation } from '../../hook/use-ai-data-preparation.hook';
import { AiProgressBar } from '../ai-progress-bar/ai-progress-bar';

const ICON_CONTAINER_SIZE = 36;
const ICON_SIZE = 20;
const FULL_PROGRESS = 100;

export const AiDataCard = () => {
    const { t } = useLingui();
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
    let idleSubtitle = t`Downloading AI model...`;
    let idleProgress = downloadPercent;
    if (isLlmReady) {
        idleSubtitle = t`${embeddedCount} of ${totalContexts} contexts embedded`;
        idleProgress = completionRatio;
    } else if (isLlmInitializing) {
        idleSubtitle = t`Initializing AI model...`;
        idleProgress = downloadPercent;
    }
    const brainProgress = isRunning ? progress : idleProgress;
    const subtitle = isRunning ? phaseLabel : idleSubtitle;

    return (
        <HorizontalCell
            {...(!isRunning && { onPress: () => void start(), onLongPress: () => void startFresh() })}
            left={<AiBrainProgress progress={brainProgress} size={ICON_CONTAINER_SIZE} iconSize={ICON_SIZE} isAnimating={isRunning} />}
            right={<Text className="text-sm font-medium text-secondary-foreground">{`${brainProgress}%`}</Text>}
            variant="secondary"
            contentClassName="gap-y-xs"
        >
            <Text className="text-sm font-medium text-primary">{t`Prepare AI Data`}</Text>
            <Text className="text-xs font-medium text-secondary-foreground">{subtitle}</Text>
            <AiProgressBar progress={brainProgress} />
        </HorizontalCell>
    );
};
