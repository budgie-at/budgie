import { InstrumentMarketDataJobStatusEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';

interface Props {
    readonly loadedDays: number;
    readonly percent: number;
    readonly status: InstrumentMarketDataJobStatusEnum | null;
    readonly totalDays: number;
}

export const MarketDataHistoryProgress = ({ loadedDays, percent, status, totalDays }: Props) => {
    const hasMeasuredProgress = isPositiveNumber(totalDays);
    const isFailed = status === InstrumentMarketDataJobStatusEnum.FAILED;

    return (
        <View className="border-secondary-corner bg-secondary-background rounded-5xl border px-4xl py-4xl gap-y-md">
            <View className="flex-row items-center justify-between gap-x-md">
                <Text className="text-primary text-sm font-medium">
                    {isFailed ? <Trans>History loading paused</Trans> : <Trans>Loading market history</Trans>}
                </Text>

                {hasMeasuredProgress ? (
                    <Text className="text-secondary-foreground text-xs font-medium">
                        <Trans>
                            {loadedDays}/{totalDays} days
                        </Trans>
                    </Text>
                ) : null}
            </View>

            <AiProgressBar progress={percent} />

            <Text className="text-secondary-foreground text-xs">
                {isFailed ? <Trans>We will retry this quietly.</Trans> : <Trans>Prices fill in quietly while you use the app.</Trans>}
            </Text>
        </View>
    );
};
