import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, ReduceMotion } from 'react-native-reanimated';

import { isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';

interface Props {
    readonly label: string;
    readonly destinationAmount: number;
    readonly destinationSymbol: string;
    readonly sourceCode: string;
    readonly destinationCode: string;
    readonly exchangeRate: number;
    readonly isManualRate: boolean;
    readonly onPress?: () => void;
}

const ANIMATION_DELAY = 100;
const ANIMATION_DURATION = 200;
const ENTERING_ANIMATION = FadeInUp.delay(ANIMATION_DELAY).duration(ANIMATION_DURATION).reduceMotion(ReduceMotion.System);

export const ConversionRow = (props: Props) => {
    const { label, destinationAmount, destinationSymbol, sourceCode, destinationCode, exchangeRate, isManualRate, onPress } = props;
    const { t } = useLingui();
    const isAmountProtected = useIsAmountProtected();
    const formatAmount = useFormatDigits(2);
    const formatRate = useFormatDigits(0, 6);

    const prefix = isManualRate ? '=' : '\u2248';
    const formattedAmount = formatAmount(isPositiveNumber(destinationAmount) ? destinationAmount : 0, destinationSymbol);
    const formattedRate = isPositiveNumber(exchangeRate) ? formatRate(exchangeRate) : '—';
    const rateLabel = t`1 ${sourceCode} = ${formattedRate} ${destinationCode}`;
    const exchangeRateLabel = t`Exchange rate: ${rateLabel}`;
    const displayAmount = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : `${prefix} ${formattedAmount}`;
    const accessibilityLabel = `${label}: ${displayAmount}. ${exchangeRateLabel}`;

    return (
        <Animated.View entering={ENTERING_ANIMATION}>
            <HapticPressable
                className="min-h-[56px] flex-row items-center gap-md rounded-2xl border-hairline border-surface-separator bg-transaction-detail-row px-lg py-sm dark:border-transparent"
                testID={TransferQuickFormSelector.ConversionRow}
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={t`Edit the amount`}
                accessibilityRole="button"
                onPress={onPress}
            >
                <View className="flex-1">
                    <Text
                        className="text-[13px] leading-[18px] text-secondary-foreground"
                        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                        numberOfLines={1}
                    >
                        {label}
                    </Text>
                    <Text
                        className="text-[17px] leading-[22px] font-semibold tabular-nums text-primary"
                        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                        numberOfLines={1}
                    >
                        {displayAmount}
                    </Text>
                </View>
                <Text
                    className="shrink text-right text-[13px] leading-[18px] tabular-nums text-secondary-foreground"
                    maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                    numberOfLines={2}
                >
                    {rateLabel}
                </Text>
                <Icon icon={UserIconNameEnum.Pencil} size={14} className="text-secondary-foreground" />
            </HapticPressable>
        </Animated.View>
    );
};
