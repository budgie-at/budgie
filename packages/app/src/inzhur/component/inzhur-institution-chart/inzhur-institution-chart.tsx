import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useInzhurInstitutionGainQuery } from '../../query/use-inzhur-gain.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurPerformanceChart } from '../inzhur-performance-chart/inzhur-performance-chart';

export const InzhurInstitutionChart = () => {
    const { t } = useLingui();
    const report = useInzhurInstitutionGainQuery();

    return isDefined(report) ? (
        <InzhurPerformanceChart points={report.series} gains={report.gains} subject={t`Value`} testID={InzhurSelector.ValueChart} />
    ) : null;
};
