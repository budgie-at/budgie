import { useAtomValue } from '@effect/atom-react/Hooks';
import { useWindowDimensions } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { THOUSAND } from '../../i18n/constant/compact-thresholds.constant';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { YIELD_AXIS_GUTTER } from '../constant/yield-axis-gutter.constant';
import { YIELD_PLOT_HEIGHT } from '../constant/yield-plot-height.constant';
import { YIELD_STACK_GROUPS } from '../constant/yield-stack-groups.constant';
import { YieldChartModeEnum } from '../enum/yield-chart-mode.enum';
import { buildYieldAxisLabels } from '../utils/build-yield-axis-labels.util';
import { buildYieldSummaryAxis } from '../utils/build-yield-summary-axis.util';
import { pickYieldCompactDivisor } from '../utils/pick-yield-compact-divisor.util';

import { useFormatYieldCompactAmount } from './use-format-yield-compact-amount.hook';
import { useYieldSummary } from './use-yield-summary.hook';

import type { YieldAxisInterface } from '../interface/yield-axis.interface';

const GLYPH_WIDTH = 6.4;
const GUTTER_PADDING = 8;
const MAX_FONT_SCALE = 1.3;

export const useYieldAxisLabels = (axis: YieldAxisInterface) => {
    const isAmountProtected = useIsAmountProtected();
    const formatCompact = useFormatYieldCompactAmount();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const { fontScale } = useWindowDimensions();
    const summary = useYieldSummary();

    const buildLabels = (target: YieldAxisInterface) => {
        const divisor = pickYieldCompactDivisor(target.top, THOUSAND);

        return buildYieldAxisLabels(target, YIELD_PLOT_HEIGHT, value =>
            isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatCompact(value, divisor, symbol)
        );
    };
    const labels = buildLabels(axis);
    const stableAxes = isDefined(summary)
        ? Object.values(YieldChartModeEnum).flatMap(mode =>
              [null, ...YIELD_STACK_GROUPS].map(group => buildYieldSummaryAxis(summary, group, mode))
          )
        : [axis];
    const widest = Math.max(...stableAxes.flatMap(buildLabels).map(({ text }) => text.length), ...labels.map(({ text }) => text.length));
    const gutter = Math.max(Math.ceil(widest * GLYPH_WIDTH * Math.min(fontScale, MAX_FONT_SCALE)) + GUTTER_PADDING, YIELD_AXIS_GUTTER);

    return { labels, gutter };
};
