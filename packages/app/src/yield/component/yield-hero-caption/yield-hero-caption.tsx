import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { use } from 'react';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { YIELD_HERO_CAPTION_HEIGHT } from '../../constant/yield-hero-metrics.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { useYieldSinceDate } from '../../hook/use-yield-since-date.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldHeroPeriodCaption } from '../yield-hero-period-caption/yield-hero-period-caption';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
    readonly bucket: YieldBucketInterface | null;
}

const CAPTION_MAX_FONT_SIZE_MULTIPLIER = 1.5;
const CAPTION_STYLE = { minHeight: YIELD_HERO_CAPTION_HEIGHT };

export const YieldHeroCaption = ({ summary, bucket }: Props) => {
    const { t } = useLingui();
    const { screenKey, mode, isPeriodCaption } = use(YieldScreenContext);
    const sinceDate = useYieldSinceDate(summary);
    const { formatPeriod } = useYieldDateLabels();
    const { formatDayAndMonthAndYear } = useFormatDate();

    const { group } = screenKey.key;

    if (isPeriodCaption && isDefined(screenKey.period)) {
        return <YieldHeroPeriodCaption period={screenKey.period} />;
    }

    const groupLabel = isDefined(group) ? t(YIELD_GROUP_LABEL[group]) : '';
    const throughDay = isDefined(bucket) ? formatDayAndMonthAndYear(parseISO(bucket.end)) : '';
    const bucketPeriod = isDefined(bucket) ? formatPeriod(bucket, summary.bucketUnit) : '';
    const restingCaption = isDefined(group) ? t`${groupLabel} since ${sinceDate}` : t`Earned since ${sinceDate}`;
    const scrubCaption = mode === YieldChartModeEnum.RUNNING_TOTAL ? t`Earned through ${throughDay}` : t`Earned in ${bucketPeriod}`;
    const caption = isDefined(bucket) ? scrubCaption : restingCaption;

    return (
        <Text
            testID={PassiveIncomeSelector.Caption}
            numberOfLines={2}
            style={CAPTION_STYLE}
            maxFontSizeMultiplier={CAPTION_MAX_FONT_SIZE_MULTIPLIER}
            className="text-[13px] tabular-nums text-secondary-foreground"
        >
            {caption}
        </Text>
    );
};
