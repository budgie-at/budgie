import { useLingui } from '@lingui/react/macro';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { BIOMETRIC_KIND_ICON } from '../../constant/biometric-kind-icon.constant';
import { pinKeypadIconKeyVariants } from '../../constant/pin-keypad-icon-key-variants.constant';
import { BiometricKindEnum } from '../../enum/biometric-kind.enum';
import { useIsCompactPinLayout } from '../../hook/use-is-compact-pin-layout.hook';
import { PinFormSelector } from '../pin-form/pin-form.selector';

interface Props {
    readonly biometricKind?: BiometricKindEnum | null;
    readonly onPress?: EmptyFn;
}

export const PinFormBiometricButton = ({ biometricKind = null, onPress }: Props) => {
    const { t } = useLingui();
    const isCompact = useIsCompactPinLayout();
    const canScan = isDefined(onPress);
    const kind = biometricKind ?? BiometricKindEnum.BIOMETRICS;
    const accessibilityLabels: Record<BiometricKindEnum, string> = {
        [BiometricKindEnum.FACE_ID]: t`Unlock with Face ID`,
        [BiometricKindEnum.TOUCH_ID]: t`Unlock with Touch ID`,
        [BiometricKindEnum.FACE_UNLOCK]: t`Unlock with face`,
        [BiometricKindEnum.FINGERPRINT]: t`Unlock with fingerprint`,
        [BiometricKindEnum.BIOMETRICS]: t`Unlock with biometrics`
    };
    const biometricIcon = BIOMETRIC_KIND_ICON[kind];
    const accessibilityLabel = accessibilityLabels[kind];

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
