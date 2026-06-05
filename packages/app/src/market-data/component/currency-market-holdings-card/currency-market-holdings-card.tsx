import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { cn } from '../../../@generic/utils/cn.util';
import { useCryptoInstrumentTotalQuery } from '../../../account/query/use-crypto-instrument-total.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useCryptoInstrumentPositionQuery } from '../../query/use-crypto-instrument-position.query';

import type { InstrumentDailyMarketPriceEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: InstrumentEntityInterface;
    readonly latestPrice: InstrumentDailyMarketPriceEntityInterface | undefined;
}

const MISSING_VALUE = '-';

const getProfit = (marketValue: number | null, costBasis: number | null) => {
    if (isDefined(marketValue) && isDefined(costBasis)) {
        return marketValue - costBasis;
    }

    return null;
};

const getProfitPercent = (profit: number | null, costBasis: number | null) => {
    if (isDefined(profit) && isDefined(costBasis) && isPositiveNumber(costBasis)) {
        return (profit / costBasis) * 100;
    }

    return null;
};

const getProfitClassName = (profit: number | null) => {
    if (isDefined(profit)) {
        if (profit >= 0) {
            return 'text-positive-foreground';
        }

        return 'text-destructive-foreground';
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

export const CurrencyMarketHoldingsCard = ({ instrument, latestPrice }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const balance = useCryptoInstrumentTotalQuery(instrument.id);
    const position = useCryptoInstrumentPositionQuery(instrument.id, defaultInstrument.id);
    const formatDigits = useDisplayFormatDigits();
    const marketValue = isDefined(latestPrice) ? balance * latestPrice.price : null;
    const profit = getProfit(marketValue, position.costBasis);
    const profitPercent = getProfitPercent(profit, position.costBasis);
    const profitClassName = getProfitClassName(profit);

    return (
        <View className="border-warning-corner bg-secondary-background rounded-5xl border p-4xl gap-y-lg">
            <View className="flex-row items-center justify-between gap-x-lg">
                <Text className="text-secondary-foreground text-xs uppercase">
                    <Trans>Your holdings</Trans>
                </Text>
                <Text className="text-warning-foreground text-xs font-semibold uppercase">{instrument.code}</Text>
            </View>

            <View className="flex-row items-end justify-between gap-x-lg">
                <ProtectedText selectable className="text-primary text-3xl font-semibold" placeholderText="***">
                    {formatDigits(balance)} {instrument.code}
                </ProtectedText>
                <ProtectedText selectable className="text-secondary-foreground text-lg font-medium" placeholderText="~ ***">
                    ~ {formatOptionalValue(marketValue, defaultInstrument.symbol, formatDigits)}
                </ProtectedText>
            </View>

            <View className="flex-row gap-x-md pt-lg">
                <View className="flex-1 rounded-3xl bg-black/20 p-lg gap-y-xs">
                    <Text className="text-secondary-foreground text-xs uppercase">
                        <Trans>Break-even</Trans>
                    </Text>
                    <ProtectedText selectable className="text-primary text-base font-semibold" placeholderText="***">
                        {formatOptionalValue(position.breakEvenPrice, defaultInstrument.symbol, formatDigits)}
                    </ProtectedText>
                </View>
                <View className="flex-1 rounded-3xl bg-black/20 p-lg gap-y-xs">
                    <Text className="text-secondary-foreground text-xs uppercase">
                        <Trans>Cost basis</Trans>
                    </Text>
                    <ProtectedText selectable className="text-primary text-base font-semibold" placeholderText="***">
                        {formatOptionalValue(position.costBasis, defaultInstrument.symbol, formatDigits)}
                    </ProtectedText>
                </View>
            </View>

            <View className="rounded-3xl bg-black/20 p-lg gap-y-xs">
                <Text className="text-secondary-foreground text-xs uppercase">
                    <Trans>Unrealized P&L</Trans>
                </Text>
                <View className="flex-row items-end justify-between gap-x-lg">
                    <ProtectedText selectable className={cn('text-lg font-semibold', profitClassName)} placeholderText="***">
                        {formatOptionalValue(profit, defaultInstrument.symbol, formatDigits)}
                    </ProtectedText>
                    <ProtectedText selectable className={cn('text-sm font-medium', profitClassName)} placeholderText="***">
                        {formatPercentValue(profitPercent, formatDigits)}
                    </ProtectedText>
                </View>
            </View>
        </View>
    );
};
