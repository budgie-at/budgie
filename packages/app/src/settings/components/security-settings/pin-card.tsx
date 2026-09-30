import { useSetting } from '../../hook/use-setting.hook';

import { PinDisabledCard } from './pin-disabled-card';
import { PinEnabledCard } from './pin-enabled-card';

export const PinCard = () => {
    const isPinEnabled = useSetting('isPinEnabled');

    return isPinEnabled ? <PinEnabledCard /> : <PinDisabledCard />;
};
