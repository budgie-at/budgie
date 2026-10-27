import { UserIconNameEnum } from '@budgie/contracts';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { PinFormSelector } from '../pin-form/pin-form.selector';

interface Props {
    readonly isFaceIdAvailable?: boolean;
    readonly onPress?: EmptyFn;
}

export const PinFormBiometricButton = ({ isFaceIdAvailable = false, onPress }: Props) => {
    const canScan = isDefined(onPress);
    const biometricIcon = isFaceIdAvailable ? UserIconNameEnum.ScanFace : UserIconNameEnum.Fingerprint;

    return (
        <HapticPressable
            disabled={!canScan}
            onPress={onPress}
            testID={PinFormSelector.BiometricButton}
            className="flex-1 aspect-square rounded-3xl justify-center items-center max-w-23"
        >
            {canScan ? <Icon icon={biometricIcon} className="text-primary" size={16} /> : null}
        </HapticPressable>
    );
};
