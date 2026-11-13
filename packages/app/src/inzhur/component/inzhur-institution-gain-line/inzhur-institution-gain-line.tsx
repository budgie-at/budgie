import { InzhurGainRangeEnum } from '@budgie/sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';

import { isDefined } from '@rnw-community/shared';

import { GainLine } from '../../../@generic/component/gain-line/gain-line';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { inzhurChartScrubAtom } from '../../constant/inzhur-chart-scrub-atom.constant';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { useInzhurInstitutionGainQuery } from '../../query/use-inzhur-gain.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

export const InzhurInstitutionGainLine = () => {
    const { t } = useLingui();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const report = useInzhurInstitutionGainQuery();
    const scrubbedPoint = useAtomValue(inzhurChartScrubAtom);
    const hryvniaSymbol = useHryvniaInstrumentQuery()?.symbol ?? '';
    const allTime = report?.gains.find(gain => gain.range === InzhurGainRangeEnum.ALL);
    const gain = scrubbedPoint?.value ?? allTime?.gain;

    if (!isDefined(allTime) || !isDefined(gain)) {
        return null;
    }

    const startLabel = formatMonthAndDayAndOptionalYear(parseISO(allTime.startDate));
    const percent = isDefined(scrubbedPoint) ? null : allTime.percent;

    return (
        <GainLine
            gain={gain}
            percent={percent}
            suffix={t`since ${startLabel}`}
            instrumentSymbol={hryvniaSymbol}
            testID={InzhurSelector.GainLine}
        />
    );
};
