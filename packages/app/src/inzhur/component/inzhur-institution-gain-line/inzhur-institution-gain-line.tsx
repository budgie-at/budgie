import { InzhurGainRangeEnum } from '@budgie/sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { inzhurChartScrubAtom } from '../../constant/inzhur-chart-scrub-atom.constant';
import { useInzhurInstitutionGainQuery } from '../../query/use-inzhur-gain.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurGainLine } from '../inzhur-gain-line/inzhur-gain-line';

export const InzhurInstitutionGainLine = () => {
    const { t } = useLingui();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const report = useInzhurInstitutionGainQuery();
    const scrubbedPoint = useAtomValue(inzhurChartScrubAtom);
    const allTime = report?.gains.find(gain => gain.range === InzhurGainRangeEnum.ALL);
    const gain = scrubbedPoint?.value ?? allTime?.gain;

    if (!isDefined(allTime) || !isDefined(gain)) {
        return null;
    }

    const startLabel = formatMonthAndDayAndOptionalYear(parseISO(allTime.startDate));
    const percent = isDefined(scrubbedPoint) ? null : allTime.percent;

    return <InzhurGainLine gain={gain} percent={percent} suffix={t`since ${startLabel}`} testID={InzhurSelector.GainLine} />;
};
