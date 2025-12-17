import { useGetSettingsQuery } from '../../query/use-get-settings.query';

import { PinDisabledCard } from './pin-disabled-card';
import { PinEnabledCard } from './pin-enabled-card';

export const PinCard = () => {
    const { settings } = useGetSettingsQuery();

    const isPinEnabled = settings?.isPinEnabled === true;

    return isPinEnabled ? <PinEnabledCard /> : <PinDisabledCard />;
};
