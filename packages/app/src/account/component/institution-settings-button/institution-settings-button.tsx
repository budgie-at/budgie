import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { InstitutionSelector } from '../../../app/(main)/institution/institution.selector';

interface Props {
    readonly integrationId: number;
}

export const InstitutionSettingsButton = ({ integrationId }: Props) => {
    const { t } = useLingui();

    const handleSettings = () => void router.push({ pathname: '/bank-integration/[id]', params: { id: String(integrationId) } });

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={t`Connection settings`}
            className="size-[44px] items-center justify-center"
            testID={InstitutionSelector.SettingsButton}
            onPress={handleSettings}
        >
            <Icon icon={UserIconNameEnum.Settings} size={24} className="text-primary" />
        </HapticPressable>
    );
};
