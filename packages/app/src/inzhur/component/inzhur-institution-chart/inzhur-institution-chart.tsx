import { InzhurGainRangeEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useInzhurInstitutionGainQuery } from '../../query/use-inzhur-gain.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurPerformanceChart } from '../inzhur-performance-chart/inzhur-performance-chart';

export const InzhurInstitutionChart = () => {
    const { t } = useLingui();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const report = useInzhurInstitutionGainQuery();
    const startDate = report?.gains.find(gain => gain.range === InzhurGainRangeEnum.ALL)?.startDate;

    if (!isDefined(report) || !isDefined(startDate)) {
        return null;
    }

    const startLabel = formatMonthAndDayAndOptionalYear(startDate);

    return (
        <InzhurPerformanceChart
            points={report.gainSeries}
            gains={report.gains}
            subject={t`Gain`}
            caption={t`Gain since ${startLabel}`}
            testID={InzhurSelector.ValueChart}
        />
    );
};
