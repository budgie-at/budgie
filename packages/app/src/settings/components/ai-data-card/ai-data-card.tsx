import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { useAiDataPreparation } from '../../hook/use-ai-data-preparation.hook';
import { AiBrainProgress } from '../ai-brain-progress/ai-brain-progress';
import { AiProgressBar } from '../ai-progress-bar/ai-progress-bar';

const ICON_CONTAINER_SIZE = 36;
const ICON_SIZE = 20;
const FULL_PROGRESS = 100;

export const AiDataCard = () => {
    const { t } = useLingui();
    const { start, isRunning, progress, phaseLabel, embeddedCount, totalContexts } = useAiDataPreparation();

    const completionRatio = isPositiveNumber(totalContexts) ? Math.round((embeddedCount / totalContexts) * FULL_PROGRESS) : 0;
    const brainProgress = isRunning ? progress : completionRatio;
    const subtitle = isRunning ? phaseLabel : t`${embeddedCount} of ${totalContexts} contexts embedded`;

    return (
        <HorizontalCell
            {...(!isRunning && { onPress: () => void start() })}
            left={<AiBrainProgress progress={brainProgress} size={ICON_CONTAINER_SIZE} iconSize={ICON_SIZE} />}
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
