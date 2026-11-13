import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Svg from 'react-native-svg';

import { isDefined } from '@rnw-community/shared';

import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';
import { buildYieldAxis } from '../../utils/build-yield-axis.util';
import { buildYieldRunningPaths } from '../../utils/build-yield-running-paths.util';
import { buildYieldRunningTotal } from '../../utils/build-yield-running-total.util';
import { YieldChartAxis } from '../yield-chart-axis/yield-chart-axis';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly width: number;
    readonly summary: YieldSummaryInterface;
}

const LINE_WIDTH = 2;
const PRIOR_WIDTH = 1;
const PRIOR_OPACITY = 0.5;
const AREA_OPACITY = 0.08;
const DASH = '4 4';
const LABEL_MIN_GAP = 16;
const LABEL_OFFSET = 18;

export const YieldChartRunningTotal = ({ width, summary }: Props) => {
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const cumulative = buildYieldRunningTotal(summary.buckets.map(bucket => bucket.total));
    const prior = isDefined(summary.priorTotals) ? buildYieldRunningTotal(summary.priorTotals) : null;
    const axis = buildYieldAxis(Math.max(0, ...cumulative, ...(prior ?? [])), 0);
    const paths = buildYieldRunningPaths({
        cumulative,
        prior,
        estimated: summary.buckets.map(bucket => bucket.isEstimated),
        axisTop: axis.top,
        width,
        height: YIELD_PLOT_HEIGHT
    });
    const endAmount = formatAmount(cumulative.at(-1) ?? 0, symbol);
    const priorAmount = formatAmount(prior?.at(-1) ?? 0, symbol);
    const isPriorLabelVisible = isDefined(paths.priorEndY) && Math.abs(paths.priorEndY - paths.endY) >= LABEL_MIN_GAP;
    const endStyle = { top: Math.max(paths.endY - LABEL_OFFSET, 0), right: 0 };
    const priorStyle = { top: Math.max((paths.priorEndY ?? 0) - LABEL_OFFSET, 0), right: 0 };

    return (
        <View className="h-[200px]">
            <Svg width={width} height={YIELD_PLOT_HEIGHT}>
                <YieldChartAxis axis={axis} width={width} height={YIELD_PLOT_HEIGHT} />
                <StyledPath d={paths.area} fillClassName="accent-primary" fillOpacity={AREA_OPACITY} />
                <StyledPath
                    d={paths.prior}
                    strokeClassName="accent-secondary-foreground"
                    strokeWidth={PRIOR_WIDTH}
                    strokeOpacity={PRIOR_OPACITY}
                    fill="none"
                />
                <StyledPath d={paths.solid} strokeClassName="accent-primary" strokeWidth={LINE_WIDTH} fill="none" />
                <StyledPath d={paths.dashed} strokeClassName="accent-primary" strokeWidth={LINE_WIDTH} strokeDasharray={DASH} fill="none" />
            </Svg>

            <Text
                maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                className="absolute text-[11px] font-semibold tabular-nums text-primary"
                style={endStyle}
            >
                {endAmount}
            </Text>

            {isPriorLabelVisible ? (
                <Text
                    maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                    className="absolute text-[11px] tabular-nums text-secondary-foreground"
                    style={priorStyle}
                >
                    <Trans>prior {priorAmount}</Trans>
                </Text>
            ) : null}
        </View>
    );
};
