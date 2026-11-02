import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { pinKeypadIconKeyVariants } from '../../constant/pin-keypad-icon-key-variants.constant';
import { useIsCompactPinLayout } from '../../hook/use-is-compact-pin-layout.hook';
import { PinFormSelector } from '../pin-form/pin-form.selector';

interface Props {
    readonly isFaceIdAvailable?: boolean;
    readonly onPress?: EmptyFn;
}

export const PinFormBiometricButton = ({ isFaceIdAvailable = false, onPress }: Props) => {
    const { t } = useLingui();
    const isCompact = useIsCompactPinLayout();
    const canScan = isDefined(onPress);
    const biometricIcon = isFaceIdAvailable ? UserIconNameEnum.ScanFace : UserIconNameEnum.Fingerprint;
    const accessibilityLabel = isFaceIdAvailable ? t`Unlock with Face ID` : t`Unlock with Touch ID`;

    return (
        <HapticPressable
            disabled={!canScan}
            onPress={onPress}
            hitSlop={0}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityElementsHidden={!canScan}
            testID={PinFormSelector.BiometricButton}
            className={pinKeypadIconKeyVariants({ isVisible: canScan, isCompact })}
        >
            <Icon icon={biometricIcon} className="text-primary" size={28} strokeWidth={1.75} />
        </HapticPressable>
    );
};
