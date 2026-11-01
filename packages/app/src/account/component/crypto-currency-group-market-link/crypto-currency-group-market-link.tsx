import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { CryptoCurrencyGroupCardSelector } from '../crypto-currency-group-card/crypto-currency-group-card.selector';

import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly instrumentCode: string;
    readonly instrumentName: string;
    readonly formattedBalance: string;
    readonly formattedValue: string | null;
    readonly onPress: EmptyFn;
}

export const CryptoCurrencyGroupMarketLink = ({ instrumentCode, instrumentName, formattedBalance, formattedValue, onPress }: Props) => (
    <HapticPressable
        accessible
        accessibilityRole="button"
        onPress={onPress}
        className="min-h-[60px] flex-row items-center gap-x-xl pt-lg pb-sm pr-xl pl-3xl active:scale-100 active:bg-surface-fill"
        testID={CryptoCurrencyGroupCardSelector.Market(instrumentCode)}
    >
        <CryptoCurrencyIcon code={instrumentCode} size={36} className="bg-surface-disc" />

        <View className="min-w-0 flex-1 gap-y-xxs">
            <Text
                className="text-[15px] font-medium text-primary"
                maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                ellipsizeMode="tail"
                numberOfLines={2}
                testID={CryptoCurrencyGroupCardSelector.Container(instrumentCode)}
            >
                {instrumentName}
            </Text>
            <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}>
                {instrumentCode}
            </Text>
        </View>

        <View className="max-w-[55%] shrink-0 items-end gap-y-xxs">
            <ProtectedText
                className="text-right text-[17px] font-semibold tracking-tight tabular-nums text-primary"
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                numberOfLines={1}
                maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                placeholderText="***"
                testID={CryptoCurrencyGroupCardSelector.Balance(instrumentCode)}
            >
                {formattedBalance}
            </ProtectedText>

            {isDefined(formattedValue) ? (
                <ProtectedText
                    className="text-right text-[13px] text-secondary-foreground tabular-nums"
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                    numberOfLines={1}
                    placeholderText="≈ ***"
                    testID={CryptoCurrencyGroupCardSelector.Value(instrumentCode)}
                >
                    ≈ {formattedValue}
                </ProtectedText>
            ) : null}
        </View>
    </HapticPressable>
);
