import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator, Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { useAiDataPreparation } from '../../hook/use-ai-data-preparation.hook';
import { AiProgressBar } from '../ai-progress-bar/ai-progress-bar';

export const AiDataCard = () => {
    const { t } = useLingui();
    const { start, isRunning, progress, phaseLabel, embeddedCount, totalContexts } = useAiDataPreparation();

    const statusDescription = isRunning ? phaseLabel : t`${embeddedCount} of ${totalContexts} contexts embedded`;
    const leftSlot = <CircleIcon icon={UserIconNameEnum.Brain} variant="secondary" border={false} size={36} iconSize={20} />;
    const rightSlot = isRunning ? <ActivityIndicator size="small" /> : null;

    return (
        <HorizontalCell
            {...(!isRunning && { onPress: () => void start() })}
            left={leftSlot}
            right={rightSlot}
            variant="secondary"
            align="top"
            contentClassName="gap-y-xs"
        >
            <Text className="text-sm font-medium text-primary">{t`Prepare AI Data`}</Text>
            <Text className="text-sm font-medium text-secondary-foreground">{statusDescription}</Text>
            {isRunning ? <AiProgressBar progress={progress} /> : null}
        </HorizontalCell>
    );
};
