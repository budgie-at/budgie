import { useAtomValue } from '@effect/atom-react/Hooks';
import { use } from 'react';
import { useWindowDimensions } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { THOUSAND } from '../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../i18n/hook/use-format-compact-digits.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { YIELD_PLOT_HEIGHT } from '../constant/yield-plot-height.constant';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldChartModeEnum } from '../enum/yield-chart-mode.enum';
import { buildYieldAxisLabels } from '../utils/build-yield-axis-labels.util';
import { buildYieldSummaryAxis } from '../utils/build-yield-summary-axis.util';

import { useYieldSummary } from './use-yield-summary.hook';

import type { YieldAxisInterface } from '../interface/yield-axis.interface';

const GLYPH_WIDTH = 6.4;
const GUTTER_PADDING = 8;
const MIN_GUTTER = 28;
const MAX_FONT_SCALE = 1.3;

export const useYieldAxisLabels = (axis: YieldAxisInterface) => {
    const isAmountProtected = useIsAmountProtected();
    const formatCompact = useFormatCompactDigits(THOUSAND);
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const { fontScale } = useWindowDimensions();
    const { screenKey } = use(YieldScreenContext);
    const summary = useYieldSummary();

    const format = (value: number) => (isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatCompact(value, symbol));
    const labels = buildYieldAxisLabels(axis, YIELD_PLOT_HEIGHT, format);
    const modeAxes = Object.values(YieldChartModeEnum).map(mode =>
        isDefined(summary) ? buildYieldSummaryAxis(summary, screenKey.key.group, mode) : axis
    );
    const widest = Math.max(
        ...modeAxes.flatMap(modeAxis => buildYieldAxisLabels(modeAxis, YIELD_PLOT_HEIGHT, format)).map(({ text }) => text.length),
        ...labels.map(({ text }) => text.length)
    );
    const gutter = Math.max(Math.ceil(widest * GLYPH_WIDTH * Math.min(fontScale, MAX_FONT_SCALE)) + GUTTER_PADDING, MIN_GUTTER);

    return { labels, gutter };
};
