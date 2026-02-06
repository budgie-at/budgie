import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { useAiDataPreparation } from '../../hook/use-ai-data-preparation.hook';
import { AiProgressBar } from '../ai-progress-bar/ai-progress-bar';
import { SettingsCard } from '../settings-card/settings-card';

export const AiDataCard = () => {
    const { t } = useLingui();
    const { start, isRunning, progress, phaseLabel, embeddedCount, totalContexts } = useAiDataPreparation();

    const statusDescription = isRunning ? phaseLabel : t`${embeddedCount} of ${totalContexts} contexts embedded`;

    return (
        <View className="gap-y-md">
            <SettingsCard
                onPress={start}
                isLoading={isRunning}
                title={t`Prepare AI Data`}
                description={statusDescription}
                icon={UserIconNameEnum.Brain}
                variant="secondary"
            />
            <AiProgressBar progress={progress} phaseLabel={phaseLabel} isActive={isRunning} />
        </View>
    );
};
