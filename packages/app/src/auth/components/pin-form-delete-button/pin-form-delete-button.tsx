import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { pinKeypadIconKeyVariants } from '../../constant/pin-keypad-icon-key-variants.constant';
import { useIsCompactPinLayout } from '../../hook/use-is-compact-pin-layout.hook';
import { PinFormSelector } from '../pin-form/pin-form.selector';

interface Props {
    readonly onPress?: () => void;
}

export const PinFormDeleteButton = ({ onPress }: Props) => {
    const { t } = useLingui();
    const isCompact = useIsCompactPinLayout();
    const isVisible = isDefined(onPress);

    return (
        <HapticPressable
            disabled={!isVisible}
            onPress={onPress}
            hitSlop={0}
            accessibilityRole="button"
            accessibilityLabel={t`Delete last digit`}
            accessibilityElementsHidden={!isVisible}
            testID={PinFormSelector.DeleteButton}
            className={pinKeypadIconKeyVariants({ isVisible, isCompact })}
        >
            <Icon icon={UserIconNameEnum.Delete} className="text-primary" size={28} strokeWidth={1.75} />
        </HapticPressable>
    );
};
