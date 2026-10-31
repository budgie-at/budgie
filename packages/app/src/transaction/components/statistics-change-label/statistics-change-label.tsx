import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { getSingleMonth } from '../../../@generic/utils/date/get-single-month.util';
import { useFormatDateRange } from '../../../i18n/hook/use-format-date-range.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatPercent } from '../../../i18n/hook/use-format-percent.hook';

import type { DateRangeInterface } from '@budgie/contracts';

interface Props {
    readonly current: number;
    readonly previous: number;
    readonly previousRange: DateRangeInterface;
}

export const StatisticsChangeLabel = ({ current, previous, previousRange }: Props) => {
    const { t } = useLingui();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const formatPercent = useFormatPercent();
    const formatDateRange = useFormatDateRange();
    const { formatShortMonth } = useFormatDate();

    const isIncrease = current >= previous;
    const changePercent = formatPercent(Math.abs(current - previous) / previous);
    const previousLabel = formatDateRange(previousRange);
    const changeLabel = isIncrease ? t`${changePercent} more than ${previousLabel}` : t`${changePercent} less than ${previousLabel}`;
    const previousMonth = getSingleMonth(previousRange);
    const shortPreviousLabel = isDefined(previousMonth) ? formatShortMonth(previousMonth) : t`previous period`;
    const conciseLabel = isIncrease ? t`+${changePercent} vs ${shortPreviousLabel}` : t`−${changePercent} vs ${shortPreviousLabel}`;
    const visibleLabel = isAccessibilityTextSize ? conciseLabel : `${isIncrease ? '↑' : '↓'} ${changeLabel}`;

    return (
        <Text
            accessibilityLabel={changeLabel}
            maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
            className="text-sm text-secondary-foreground"
        >
            {visibleLabel}
        </Text>
    );
};
