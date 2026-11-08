import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { MOTION_FADE_IN, MOTION_FADE_OUT } from '../../../@generic/constant/motion.constant';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { TRANSACTION_LARGE_TEXT_SCALE } from '../../constant/transaction-large-text-scale.constant';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';

interface Props {
    readonly dividerOffset: number;
    readonly isEnabled: boolean;
    readonly onPress: () => void;
}

const SWAP_SIZE = 28;
const SWAP_HIT_SLOP = 8;
const DISABLED_OPACITY = 0.4;

const wrapperVariants = cva('', {
    variants: {
        isLargeText: {
            true: '',
            false: 'absolute inset-0'
        }
    }
});

const swapVariants = cva('items-center justify-center rounded-full bg-surface-disc', {
    variants: {
        isLargeText: {
            true: 'min-h-[44px] max-w-full self-end mt-[8px] flex-row gap-x-[8px] px-xl py-sm',
            false: 'absolute left-[56px] h-[28px] w-[28px]'
        }
    }
});

export const TransferSwapButton = ({ dividerOffset, isEnabled, onPress }: Props) => {
    const { t } = useLingui();
    const { fontScale } = useWindowDimensions();
    const isLargeText = fontScale >= TRANSACTION_LARGE_TEXT_SCALE;
    const enabledOpacity = isEnabled ? 1 : DISABLED_OPACITY;
    const style = isLargeText
        ? { opacity: enabledOpacity }
        : { top: dividerOffset - SWAP_SIZE / 2, opacity: dividerOffset > 0 ? enabledOpacity : 0 };
    const accessibilityState = { disabled: !isEnabled };
    const iconSize = isLargeText ? 20 : 14;

    return (
        <Animated.View
            className={wrapperVariants({ isLargeText })}
            entering={MOTION_FADE_IN}
            exiting={MOTION_FADE_OUT}
            pointerEvents="box-none"
        >
            <HapticPressable
                className={swapVariants({ isLargeText })}
                style={style}
                hitSlop={SWAP_HIT_SLOP}
                onPress={onPress}
                pressFeedback={HapticPressFeedbackEnum.SELECTION}
                disabled={!isEnabled}
                accessibilityState={accessibilityState}
                testID={TransferQuickFormSelector.SwapAccounts}
                accessibilityLabel={t`Swap accounts`}
                accessibilityRole="button"
            >
                <Icon icon={UserIconNameEnum.ArrowUpDown} size={iconSize} className="text-primary" />
                {isLargeText ? (
                    <Text
                        className="min-w-0 shrink text-[17px] text-primary"
                        maxFontSizeMultiplier={1.35}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        <Trans>Swap accounts</Trans>
                    </Text>
                ) : null}
            </HapticPressable>
        </Animated.View>
    );
};
