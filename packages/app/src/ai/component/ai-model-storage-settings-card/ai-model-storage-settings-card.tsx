import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';

export const AiModelStorageSettingsCard = () => {
    const { t } = useLingui();
    const handlePress = () => void router.push('/settings/ai-models');

    return (
        <SettingsCard
            onPress={handlePress}
            title={t`AI features`}
            description={t`Choose features and free space from unused downloads`}
            icon={UserIconNameEnum.Brain}
            variant="ghost"
            testID={SettingsPageSelector.AiModelsCard}
        />
    );
};
