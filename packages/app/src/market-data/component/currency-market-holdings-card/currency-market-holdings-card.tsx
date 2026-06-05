import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useCryptoInstrumentTotalQuery } from '../../../account/query/use-crypto-instrument-total.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useCryptoInstrumentPositionQuery } from '../../query/use-crypto-instrument-position.query';
import { CurrencyMarketHoldingMetricRow } from '../currency-market-holding-metric-row/currency-market-holding-metric-row';

import type { InstrumentDailyMarketPriceEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: InstrumentEntityInterface;
    readonly latestPrice: InstrumentDailyMarketPriceEntityInterface | undefined;
}

const MISSING_VALUE = '-';
const DISPLAY_ZERO_THRESHOLD = 0.005;

const normalizeDisplayValue = (value: number) => {
    if (Math.abs(value) < DISPLAY_ZERO_THRESHOLD) {
        return 0;
    }

    return value;
};

const getProfit = (marketValue: number | null, costBasis: number | null) => {
    if (isDefined(marketValue) && isDefined(costBasis)) {
        return normalizeDisplayValue(marketValue - costBasis);
    }

    return null;
};

const getProfitPercent = (profit: number | null, costBasis: number | null) => {
    if (isDefined(profit) && isDefined(costBasis) && isPositiveNumber(costBasis)) {
        return normalizeDisplayValue((profit / costBasis) * 100);
    }

    return null;
};

const getProfitClassName = (profit: number | null) => {
    if (isDefined(profit)) {
        if (isPositiveNumber(profit)) {
            return 'text-positive-foreground';
        }

        if (profit < 0) {
            return 'text-destructive-foreground';
        }

        return 'text-primary';
    }

    return 'text-secondary-foreground';
};

const formatOptionalValue = (value: number | null, symbol: string, formatDigits: ReturnType<typeof useDisplayFormatDigits>) => {
    if (isDefined(value)) {
        return formatDigits(value, symbol);
    }

    return MISSING_VALUE;
};

const formatPercentValue = (value: number | null, formatDigits: ReturnType<typeof useDisplayFormatDigits>) => {
    if (isDefined(value)) {
        return `${formatDigits(value)}%`;
    }

    return MISSING_VALUE;
};

const formatProfitValue = (
    profit: number | null,
    profitPercent: number | null,
    symbol: string,
    formatDigits: ReturnType<typeof useDisplayFormatDigits>
) => {
    const formattedProfit = formatOptionalValue(profit, symbol, formatDigits);

    if (isDefined(profit) && isDefined(profitPercent)) {
        return `${formattedProfit} (${formatPercentValue(profitPercent, formatDigits)})`;
    }

    return formattedProfit;
};

export const CurrencyMarketHoldingsCard = ({ instrument, latestPrice }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const balance = useCryptoInstrumentTotalQuery(instrument.id);
    const position = useCryptoInstrumentPositionQuery(instrument.id, defaultInstrument.id);
    const formatDigits = useDisplayFormatDigits();
    const marketValue = isDefined(latestPrice) ? balance * latestPrice.price : null;
    const profit = getProfit(marketValue, position.costBasis);
    const profitPercent = getProfitPercent(profit, position.costBasis);
    const profitClassName = getProfitClassName(profit);
    const formattedBalance = `${formatDigits(balance)} ${instrument.code}`;
    const formattedMarketValue = formatOptionalValue(marketValue, defaultInstrument.symbol, formatDigits);
    const formattedBreakEvenPrice = formatOptionalValue(position.breakEvenPrice, defaultInstrument.symbol, formatDigits);
    const formattedCostBasis = formatOptionalValue(position.costBasis, defaultInstrument.symbol, formatDigits);
    const formattedProfit = formatProfitValue(profit, profitPercent, defaultInstrument.symbol, formatDigits);

    return (
        <View className="border-warning-corner bg-secondary-background rounded-5xl border px-4xl py-3xl gap-y-3xl overflow-hidden">
            <View className="flex-row items-center justify-between gap-x-lg">
                <Text className="text-secondary-foreground text-xs uppercase">
                    <Trans>Your holdings</Trans>
                </Text>
                <Text className="text-warning-foreground text-xs font-semibold uppercase">{instrument.code}</Text>
            </View>

            <View className="flex-row items-end justify-between gap-x-lg">
                <ProtectedText selectable className="text-primary text-3xl font-semibold" placeholderText="***">
                    {formattedBalance}
                </ProtectedText>
                <ProtectedText selectable className="text-secondary-foreground text-base font-semibold" placeholderText="~ ***">
                    ~ {formattedMarketValue}
                </ProtectedText>
            </View>

            <View className="bg-warning-corner/40 h-px" />

            <View className="gap-y-lg">
                <CurrencyMarketHoldingMetricRow label={t`Break-even`} value={formattedBreakEvenPrice} />
                <CurrencyMarketHoldingMetricRow label={t`Cost basis`} value={formattedCostBasis} />
                <CurrencyMarketHoldingMetricRow label={t`Unrealized P&L`} value={formattedProfit} valueClassName={profitClassName} />
            </View>
        </View>
    );
};
