import { InstrumentMarketDataJobStatusEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';

import type { useInstrumentMarketDataProgressQuery } from '../../query/use-instrument-market-data-progress.query';

interface Props {
    readonly progress: ReturnType<typeof useInstrumentMarketDataProgressQuery>;
    readonly testID: string;
}

export const CurrencyMarketChartStatus = ({ progress, testID }: Props) => {
    const { loadedDays, percent, status, totalDays, isComplete } = progress;
    const isLoading = status !== InstrumentMarketDataJobStatusEnum.FAILED && !isComplete;

    if (!isLoading) {
        return (
            <View className="h-[184px] w-full items-center justify-center px-7xl" testID={testID}>
                <Text className="text-secondary-foreground text-center text-[15px] font-semibold">
                    <Trans>No price history yet</Trans>
                </Text>
            </View>
        );
    }

    return (
        <View className="h-[184px] w-full items-center justify-center gap-y-xs px-7xl" testID={testID}>
            <Text className="text-primary text-center text-[15px] font-semibold">
                <Trans>Loading price history</Trans>
            </Text>
            {isPositiveNumber(totalDays) ? (
                <Text className="text-secondary-foreground text-center text-[13px] tabular-nums">
                    <Trans>
                        {loadedDays} of {totalDays} days
                    </Trans>
                </Text>
            ) : null}
            <View className="mt-md w-[160px]">
                <AiProgressBar progress={percent} />
            </View>
        </View>
    );
};
