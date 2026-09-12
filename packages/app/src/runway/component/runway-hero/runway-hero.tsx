import { RunwayWindowEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { cn } from 'cn';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { RunwayAllInToggle } from '../runway-all-in-toggle/runway-all-in-toggle';
import { RunwayMeter } from '../runway-meter/runway-meter';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
    readonly window: RunwayWindowEnum;
    readonly isAllIn?: boolean;
    readonly onChangeWindow: (window: RunwayWindowEnum) => void;
    readonly onToggleAllIn: () => void;
}

const RUNWAY_WINDOW_LABELS: Record<RunwayWindowEnum, MessageDescriptor> = {
    [RunwayWindowEnum.THREE_MONTHS]: msg`3`,
    [RunwayWindowEnum.SIX_MONTHS]: msg`6`,
    [RunwayWindowEnum.TWELVE_MONTHS]: msg`12`
};

export const RunwayHero = (props: Props) => {
    const { computation, window, isAllIn = false, onChangeWindow, onToggleAllIn } = props;
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { formatMonthAndYear } = useFormatDate();

    const net = isAllIn ? computation.allInNet : computation.net;
    const runwayMonths = isAllIn ? computation.allInRunwayMonths : computation.runwayMonths;
    const runsOutAt = isAllIn ? computation.allInRunsOutAt : computation.runsOutAt;
    const cardVariant = net >= 0 ? 'positive' : 'destructive';
    const windowOptions = [
        { value: RunwayWindowEnum.THREE_MONTHS, label: t(RUNWAY_WINDOW_LABELS[RunwayWindowEnum.THREE_MONTHS]) },
        { value: RunwayWindowEnum.SIX_MONTHS, label: t(RUNWAY_WINDOW_LABELS[RunwayWindowEnum.SIX_MONTHS]) },
        { value: RunwayWindowEnum.TWELVE_MONTHS, label: t(RUNWAY_WINDOW_LABELS[RunwayWindowEnum.TWELVE_MONTHS]) }
    ];
    const runOutDate = isDefined(runsOutAt) ? formatMonthAndYear(runsOutAt) : '';
    const coverMonths = isPositiveNumber(computation.burn) ? Math.round(computation.liquid / computation.burn) : null;
    const formattedNet = formatDigits(convertFromMicroUnits(net), defaultInstrument.symbol);
    const coverLine = isDefined(coverMonths) ? (
        <Text className="text-xs text-secondary-foreground">
            <Trans>Covered by {coverMonths} months of expenses</Trans>
        </Text>
    ) : (
        <Text className="text-xs text-secondary-foreground">
            <Trans>Covered by your liquid balance</Trans>
        </Text>
    );

    return (
        <Card variant={cardVariant} className="gap-y-lg">
            <View className="flex-row items-center justify-between">
                <Text className={cn('text-xxs font-semibold uppercase tracking-wider', FOREGROUND_COLOR_PALETTE[cardVariant])}>
                    <Trans>The answer</Trans>
                </Text>

                <View className="w-32">
                    <SegmentedTabs options={windowOptions} value={window} onChange={onChangeWindow} />
                </View>
            </View>

            <Text className="text-xl font-semibold leading-tight text-primary">
                {cardVariant === 'positive' ? <Trans>You are building, not burning.</Trans> : <Trans>You spend more than you earn.</Trans>}
            </Text>

            {cardVariant === 'positive' ? (
                <Text className="text-4xl font-bold text-primary">{t`+${formattedNet} / mo`}</Text>
            ) : (
                <View className="flex-row items-baseline gap-x-sm">
                    <Text className="text-4xl font-bold text-primary">{`≈ ${formatDigits(Math.round(runwayMonths ?? 0))}`}</Text>
                    <Text className="text-md font-medium text-secondary-foreground">
                        <Trans>months left</Trans>
                    </Text>
                </View>
            )}

            {cardVariant === 'positive' ? (
                coverLine
            ) : (
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Runs out around {runOutDate}</Trans>
                </Text>
            )}

            <RunwayMeter months={runwayMonths} isPositive={cardVariant === 'positive'} />

            <View className="items-end">
                <RunwayAllInToggle isAllIn={isAllIn} onToggle={onToggleAllIn} />
            </View>
        </Card>
    );
};
