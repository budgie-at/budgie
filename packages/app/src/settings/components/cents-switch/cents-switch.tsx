import { useLingui } from '@lingui/react/macro';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ThemedSwitch } from '../../../@generic/components/themed-switch/themed-switch';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { useSettingsContext } from '../../context/settings.context';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

export const CentsSwitch = () => {
    const { settings } = useSettingsContext();
    const { t } = useLingui();

    const toggleShowCents = async (checked: boolean) => {
        await updateSettingsMutation({ showCents: !checked });
    };

    return (
        <SettingsCard
            title={t`Hide Cents`}
            description={t`Show $1,234.56 instead of $1,235`}
            right={<ThemedSwitch className="my-auto" onValueChange={toggleShowCents} value={!settings.showCents} />}
            left={<CircleIcon size="1_5xl" icon={ICONS.DollarSign} variant="positive" border={false} />}
        />
    );
};
