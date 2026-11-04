import { InstrumentEntityInterface } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useCryptoValuationRateQuery } from '../../../exchange-rate/query/use-crypto-valuation-rate.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { CryptoCurrencyGroupCardSelector } from '../crypto-currency-group-card/crypto-currency-group-card.selector';

interface Props {
    readonly instrument: Pick<InstrumentEntityInterface, 'id' | 'code' | 'name'>;
    readonly balance: number;
}

const rowVariants = cva('min-h-[60px] gap-x-xl pt-lg pb-xs pr-xl pl-3xl active:scale-100 active:bg-surface-fill', {
    variants: { isStacked: { true: 'gap-y-sm', false: 'flex-row items-center' } }
});
const amountVariants = cva('gap-y-xxs', {
    variants: { isStacked: { true: 'items-start', false: 'max-w-[55%] shrink-0 items-end' } }
});

export const CryptoCurrencyGroupMarketLink = ({ instrument, balance }: Props) => {
    const isStacked = useIsAccessibilityTextSize();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();
    const formatCryptoDigits = useFormatDigits(0, MICRO_UNIT_DECIMAL_PLACES);
    const valuationRate = useCryptoValuationRateQuery(instrument.id, defaultInstrument.id);
    const isFractionalRate = isPositiveNumber(valuationRate) && valuationRate < 1;
    const rateFractionDigits = isFractionalRate ? Math.min(Math.max(Math.ceil(-Math.log10(valuationRate)) + 2, 4), 8) : 2;
    const formatRate = useFormatDigits(2, rateFractionDigits);

    const navigateToMarket = () => void router.push({ pathname: '/currency/[id]', params: { id: String(instrument.id) } });
    const formattedBalance = `${formatCryptoDigits(balance)} ${instrument.code}`;
    const formattedValue = isDefined(valuationRate) ? formatDigits(balance * valuationRate, defaultInstrument.symbol) : null;
    const formattedRate = isDefined(valuationRate) ? formatRate(valuationRate) : null;
    const instrumentCode = instrument.code;
    const defaultInstrumentSymbol = defaultInstrument.symbol;

    return (
        <HapticPressable
            accessible
            accessibilityRole="button"
            onPress={navigateToMarket}
            className={rowVariants({ isStacked })}
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
                    {instrument.name}
                </Text>
                <View className="flex-row flex-wrap">
                    <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}>
                        {`${instrumentCode} · `}
                    </Text>
                    <Text
                        className="text-[13px] text-secondary-foreground tabular-nums"
                        maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
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
                </View>
            </View>

            <View className={amountVariants({ isStacked })}>
                <ProtectedText
                    className="text-[17px] font-semibold tracking-tight tabular-nums text-primary"
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
                        className="text-[13px] text-secondary-foreground tabular-nums"
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
};
