import { Trans, useLingui } from '@lingui/react/macro';
import { cn } from 'cn';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
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
    readonly isAllIn?: boolean;
    readonly onToggleAllIn: () => void;
}

export const RunwayHero = (props: Props) => {
    const { computation, isAllIn = false, onToggleAllIn } = props;
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { formatMonthAndYear } = useFormatDate();

    const net = isAllIn ? computation.allInNet : computation.net;
    const runwayMonths = isAllIn ? computation.allInRunwayMonths : computation.runwayMonths;
    const runsOutAt = isAllIn ? computation.allInRunsOutAt : computation.runsOutAt;
    const cardVariant = net >= 0 ? 'positive' : 'destructive';
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
            <Text className={cn('text-xxs font-semibold uppercase tracking-wider', FOREGROUND_COLOR_PALETTE[cardVariant])}>
                <Trans>The answer</Trans>
            </Text>

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
