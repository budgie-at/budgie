import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';

interface Props {
    readonly dividerOffset: number;
    readonly isEnabled: boolean;
    readonly onPress: () => void;
}

const SWAP_SIZE = 28;
const SWAP_HIT_SLOP = 8;
const DISABLED_OPACITY = 0.4;

export const TransferSwapButton = ({ dividerOffset, isEnabled, onPress }: Props) => {
    const { t } = useLingui();
    const enabledOpacity = isEnabled ? 1 : DISABLED_OPACITY;
    const style = { top: dividerOffset - SWAP_SIZE / 2, opacity: dividerOffset > 0 ? enabledOpacity : 0 };
    const accessibilityState = { disabled: !isEnabled };

    return (
        <HapticPressable
            className="absolute left-[56px] h-[28px] w-[28px] items-center justify-center rounded-full bg-surface-disc"
            style={style}
            hitSlop={SWAP_HIT_SLOP}
            onPress={onPress}
            disabled={!isEnabled}
            accessibilityState={accessibilityState}
            testID={TransferQuickFormSelector.SwapAccounts}
            accessibilityLabel={t`Swap accounts`}
            accessibilityRole="button"
        >
            <Icon icon={UserIconNameEnum.ArrowUpDown} size={14} className="text-primary" />
        </HapticPressable>
    );
};
