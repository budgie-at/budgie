import { InzhurGainRangeEnum } from '@budgie/sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { inzhurChartScrubAtom } from '../../constant/inzhur-chart-scrub-atom.constant';
import { useInzhurInstitutionGainQuery } from '../../query/use-inzhur-gain.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurAllTimeGainLine } from '../inzhur-all-time-gain-line/inzhur-all-time-gain-line';
import { InzhurGainLine } from '../inzhur-gain-line/inzhur-gain-line';

export const InzhurInstitutionGainLine = () => {
    const { t } = useLingui();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const report = useInzhurInstitutionGainQuery();
    const scrubbedPoint = useAtomValue(inzhurChartScrubAtom);
    const startDate = report?.gains.find(gain => gain.range === InzhurGainRangeEnum.ALL)?.startDate;

    if (!isDefined(report)) {
        return null;
    }

    if (isDefined(scrubbedPoint) && isDefined(startDate)) {
        const startLabel = formatMonthAndDayAndOptionalYear(startDate);

        return (
            <InzhurGainLine gain={scrubbedPoint.value} percent={null} suffix={t`since ${startLabel}`} testID={InzhurSelector.GainLine} />
        );
    }

    return <InzhurAllTimeGainLine gains={report.gains} />;
};
