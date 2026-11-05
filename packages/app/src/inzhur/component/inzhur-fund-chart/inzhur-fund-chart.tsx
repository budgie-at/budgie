import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useInzhurFundGainQuery } from '../../query/use-inzhur-gain.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurPerformanceChart } from '../inzhur-performance-chart/inzhur-performance-chart';

interface Props {
    readonly fundAccountId: number;
}

export const InzhurFundChart = ({ fundAccountId }: Props) => {
    const { t } = useLingui();
    const report = useInzhurFundGainQuery(fundAccountId);

    return isDefined(report) ? (
        <InzhurPerformanceChart points={report.prices} gains={report.gains} subject={t`Price`} testID={InzhurSelector.PriceChart} />
    ) : null;
};
