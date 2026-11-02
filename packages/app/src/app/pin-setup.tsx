import { Redirect, useLocalSearchParams } from 'expo-router';

import { isEnumValue } from '../@generic/type-guard/is-enum-value.type-guard';
import { PinSetup } from '../auth/components/pin-setup/pin-setup';
import { PinSetupModeEnum } from '../auth/enum/pin-setup-mode.enum';

export default function PinSetupScreen() {
    const { mode } = useLocalSearchParams<{ mode: PinSetupModeEnum }>();

    if (!isEnumValue(mode, PinSetupModeEnum)) {
        return <Redirect href="/settings" />;
    }

    return <PinSetup key={mode} mode={mode} />;
}
