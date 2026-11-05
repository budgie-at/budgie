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

const SWAP_SIZE = 30;
const SWAP_HIT_SLOP = 7;

export const TransferSwapButton = ({ dividerOffset, isEnabled, onPress }: Props) => {
    const { t } = useLingui();
    const style = { top: dividerOffset - SWAP_SIZE / 2, opacity: dividerOffset > 0 ? 1 : 0 };
    const accessibilityState = { disabled: !isEnabled };
    const iconClassName = isEnabled ? 'text-primary' : 'text-primary opacity-30';

    return (
        <HapticPressable
            className="absolute left-[16px] h-[30px] w-[30px] items-center justify-center rounded-full border-hairline border-surface-separator bg-surface-disc"
            style={style}
            hitSlop={SWAP_HIT_SLOP}
            onPress={onPress}
            disabled={!isEnabled}
            accessibilityState={accessibilityState}
            testID={TransferQuickFormSelector.SwapAccounts}
            accessibilityLabel={t`Swap accounts`}
            accessibilityRole="button"
        >
            <Icon icon={UserIconNameEnum.ArrowUpDown} size={15} className={iconClassName} />
        </HapticPressable>
    );
};
