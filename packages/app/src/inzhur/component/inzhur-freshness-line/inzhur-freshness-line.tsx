import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { inzhurChartScrubAtom } from '../../constant/inzhur-chart-scrub-atom.constant';
import { useInzhurFreshnessQuery } from '../../query/use-inzhur-freshness.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

export const InzhurFreshnessLine = () => {
    const { t } = useLingui();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const freshness = useInzhurFreshnessQuery();
    const scrubbedPoint = useAtomValue(inzhurChartScrubAtom);

    if (!isDefined(freshness?.priceDate)) {
        return null;
    }

    const priceDate = formatMonthAndDayAndOptionalYear(scrubbedPoint?.date ?? freshness.priceDate);

    return (
        <Text
            className="px-5xl text-center text-[15px] leading-[20px] text-secondary-foreground tabular-nums"
            testID={InzhurSelector.Freshness}
        >
            {t`Prices as of ${priceDate}`}
        </Text>
    );
};
