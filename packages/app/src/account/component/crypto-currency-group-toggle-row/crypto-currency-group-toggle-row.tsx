import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
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
            className="min-h-[36px] flex-row flex-wrap items-center justify-between gap-x-md pt-xs pb-lg pr-xl pl-[64px] active:scale-100 active:bg-surface-fill"
            testID={testID}
        >
            <View className="flex-row items-center gap-x-xs">
                <Text
                    className="text-[13px] font-medium text-secondary-foreground"
                    maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                    testID={CryptoCurrencyGroupCardSelector.AccountCount(instrumentCode)}
                >
                    {accountsCountLabel}
                </Text>
                <Icon icon={chevronIcon} size={14} className="text-secondary-foreground" />
            </View>

            <Text
                className="shrink text-right text-[13px] text-secondary-foreground tabular-nums"
                maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
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
