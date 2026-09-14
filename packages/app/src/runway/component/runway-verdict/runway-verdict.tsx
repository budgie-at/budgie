import { Trans, useLingui } from '@lingui/react/macro';
import { cn } from 'cn';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { RunwayMeter } from '../runway-meter/runway-meter';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
}

const TABULAR_NUMS_STYLE = { fontVariant: ['tabular-nums' as const] };
const ENTERING_DURATION = 240;
const ENTERING = FadeIn.duration(ENTERING_DURATION);

export const RunwayVerdict = ({ computation }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const formatMonths = useFormatDigits(0);
    const { formatMonthAndYear } = useFormatDate();

    const { burn, isPositive, liquid, monthsUsed, net, runsOutAt, runwayMonths } = computation;
    const variant = isPositive ? 'positive' : 'destructive';
    const formattedNet = formatDigits(convertFromMicroUnits(net), defaultInstrument.symbol);
    const coverMonths = isPositiveNumber(burn) ? Math.round(liquid / burn) : null;
    const runOutDate = isDefined(runsOutAt) ? formatMonthAndYear(runsOutAt) : '';
    const figure = isPositive ? `+${formattedNet}` : `≈ ${formatMonths(Math.round(runwayMonths ?? 0))}`;
    const figureUnit = isPositive ? t`per month` : t`months left`;
    const coverLine = isDefined(coverMonths) ? t`Covered by ${coverMonths} months of expenses` : t`Covered by your liquid balance`;
    const outlookLine = isPositive ? coverLine : t`Runs out around ${runOutDate}`;

    return (
        <Animated.View entering={ENTERING}>
            <Card className="gap-y-lg">
                <Text className={cn('text-md font-semibold', FOREGROUND_COLOR_PALETTE[variant])}>
                    {isPositive ? <Trans>Growing</Trans> : <Trans>Burning</Trans>}
                </Text>

                <View className="flex-row items-baseline gap-x-sm">
                    <ProtectedText
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        minimumFontScale={0.6}
                        style={TABULAR_NUMS_STYLE}
                        className="text-4xl font-bold text-primary"
                    >
                        {figure}
                    </ProtectedText>
                    <Text className="text-md font-medium text-secondary-foreground">{figureUnit}</Text>
                </View>

                <Text className="text-xs text-secondary-foreground">{outlookLine}</Text>

                {isPositive ? null : <RunwayMeter months={runwayMonths} />}

                <Text className="text-xxs text-secondary-foreground">
                    <Trans>Based on your last {monthsUsed} months</Trans>
                </Text>
            </Card>
        </Animated.View>
    );
};
