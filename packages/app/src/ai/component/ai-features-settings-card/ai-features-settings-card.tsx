import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';

const handlePress = () => void router.push('/settings/ai-features');

export const AiFeaturesSettingsCard = () => {
    const { t } = useLingui();

    return (
        <SettingsRow
            onPress={handlePress}
            title={t`AI features`}
            subtitle={t`On-device models and storage`}
            icon={UserIconNameEnum.Brain}
            variant="ghost"
            testID={SettingsPageSelector.AiFeaturesCard}
        />
    );
};
