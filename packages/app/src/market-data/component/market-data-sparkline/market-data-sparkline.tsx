import { Trans } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { InteractionManager, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { emptyFn, isPositiveNumber } from '@rnw-community/shared';

import { MarketDataSparklineSkeleton } from '../market-data-sparkline-skeleton/market-data-sparkline-skeleton';

import type { InstrumentDailyMarketPriceEntityInterface } from '@budgie/contracts';

interface Props {
    readonly prices: InstrumentDailyMarketPriceEntityInterface[];
    readonly isPositive: boolean;
    readonly testID?: string;
}

const CHART_WIDTH = 320;
const CHART_HEIGHT = 112;
const CHART_PADDING = 6;
const POSITIVE_COLOR = '#00e08a';
const NEGATIVE_COLOR = '#ff5c5c';

const getHistoryVersion = (prices: InstrumentDailyMarketPriceEntityInterface[]): string => {
    const firstPrice = prices.at(0);
    const latestPrice = prices.at(-1);

    return `${prices.length}:${firstPrice?.priceDate ?? ''}:${latestPrice?.priceDate ?? ''}`;
};

const buildPoints = (prices: InstrumentDailyMarketPriceEntityInterface[]): string => {
    if (prices.length < 2) {
        return '';
    }

    const values = prices.map(price => price.price);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const drawableWidth = CHART_WIDTH - CHART_PADDING * 2;
    const drawableHeight = CHART_HEIGHT - CHART_PADDING * 2;

    return values
        .map((value, index) => {
            const x = CHART_PADDING + (index / (values.length - 1)) * drawableWidth;
            const normalizedValue = isPositiveNumber(range) ? (value - min) / range : 0.5;
            const y = CHART_PADDING + (1 - normalizedValue) * drawableHeight;

            return `${x},${y}`;
        })
        .join(' ');
};

export const MarketDataSparkline = ({ prices, isPositive, testID }: Props) => {
    const [readyHistoryVersion, setReadyHistoryVersion] = useState('');
    const historyVersion = getHistoryVersion(prices);
    const hasRenderableHistory = prices.length >= 2;
    const isChartReady = hasRenderableHistory && readyHistoryVersion === historyVersion;

    useEffect(() => {
        if (!hasRenderableHistory) {
            return emptyFn;
        }

        const task = InteractionManager.runAfterInteractions(() => {
            setReadyHistoryVersion(historyVersion);
        });

        return () => {
            task.cancel();
        };
    }, [hasRenderableHistory, historyVersion]);

    const points = isChartReady ? buildPoints(prices) : '';
    const stroke = isPositive ? POSITIVE_COLOR : NEGATIVE_COLOR;

    if (prices.length < 2) {
        return (
            <View className="border-secondary-corner bg-secondary-background rounded-5xl border px-4xl py-6xl" testID={testID}>
                <Text className="text-secondary-foreground text-center text-sm">
                    <Trans>Market history is loading quietly.</Trans>
                </Text>
            </View>
        );
    }

    if (!isChartReady) {
        return <MarketDataSparklineSkeleton testID={testID} />;
    }

    return (
        <View className="border-secondary-corner bg-secondary-background rounded-5xl border p-lg" testID={testID}>
            <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                <Polyline points={points} fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
        </View>
    );
};
