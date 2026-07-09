import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { CryptoCurrencyGroupCardSelector } from '../crypto-currency-group-card/crypto-currency-group-card.selector';

import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly accountsCount: number;
    readonly defaultInstrumentSymbol: string;
    readonly formattedRate: string | null;
    readonly instrumentCode: string;
    readonly isOpen: boolean;
    readonly onPress: EmptyFn;
    readonly testID: string;
}

export const CryptoCurrencyGroupToggleRow = ({
    accountsCount,
    defaultInstrumentSymbol,
    formattedRate,
    instrumentCode,
    isOpen,
    onPress,
    testID
}: Props) => {
    const { t } = useLingui();
    const chevronIcon = isOpen ? UserIconNameEnum.ChevronDown : UserIconNameEnum.ChevronRight;
    const toggleAccessibilityState = { expanded: isOpen };
    const accountsCountLabel = t({
        message: plural(accountsCount, {
            one: '# account',
            other: '# accounts'
        })
    });

    return (
        <HapticPressable
            accessible
            accessibilityRole="button"
            accessibilityState={toggleAccessibilityState}
            onPress={onPress}
            className="flex-row items-end justify-between gap-x-md"
            testID={testID}
        >
            <View className="flex-row items-center gap-x-xs">
                <Text className="text-secondary-foreground text-xs" testID={CryptoCurrencyGroupCardSelector.AccountCount(instrumentCode)}>
                    {accountsCountLabel}
                </Text>
                <Icon icon={chevronIcon} size={16} className="text-secondary-foreground" />
            </View>

            <Text
                className="shrink-0 text-right text-secondary-foreground text-xs"
                testID={CryptoCurrencyGroupCardSelector.Rate(instrumentCode)}
            >
                {isDefined(formattedRate) ? (
                    <Trans>
                        1 {instrumentCode} ≈ {defaultInstrumentSymbol}
                        {formattedRate}
                    </Trans>
                ) : (
                    <Trans>Missing rate</Trans>
                )}
            </Text>
        </HapticPressable>
    );
};
