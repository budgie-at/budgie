import { useSettingsContext } from '../../context/settings.context';

import { PinDisabledCard } from './pin-disabled-card';
import { PinEnabledCard } from './pin-enabled-card';

export const PinCard = () => {
    const { settings } = useSettingsContext();

    const { isPinEnabled } = settings;

    return isPinEnabled ? <PinEnabledCard /> : <PinDisabledCard />;
};
