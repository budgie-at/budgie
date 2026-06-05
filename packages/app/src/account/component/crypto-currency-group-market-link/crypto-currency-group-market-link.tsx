import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
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
    <HapticPressable onPress={onPress} className="gap-y-3" testID={CryptoCurrencyGroupCardSelector.Market(instrumentCode)}>
        <View className="flex-row items-start justify-between gap-x-md">
            <View className="min-w-0 flex-1 flex-row items-center gap-x-md">
                <CryptoCurrencyIcon code={instrumentCode} size={36} className="bg-warning-background/20" />

                <View className="min-w-0 flex-1">
                    <Text className="text-primary text-sm font-medium" ellipsizeMode="tail" numberOfLines={1}>
                        {instrumentName}
                    </Text>
                    <Text className="text-warning-foreground text-xs font-medium uppercase">{instrumentCode}</Text>
                </View>
            </View>

            <View className="min-w-0 items-end gap-y-0.5">
                <ProtectedText className="text-right text-primary text-lg font-semibold leading-6" placeholderText="***">
                    {formattedBalance}
                </ProtectedText>

                {isDefined(formattedValue) ? (
                    <ProtectedText className="text-right text-secondary-foreground text-xs font-medium" placeholderText="≈ ***">
                        ≈ {formattedValue}
                    </ProtectedText>
                ) : null}
            </View>
        </View>
    </HapticPressable>
);
