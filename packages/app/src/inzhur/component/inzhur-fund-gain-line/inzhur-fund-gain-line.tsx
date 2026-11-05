import { isDefined } from '@rnw-community/shared';

import { useInzhurFundGainQuery } from '../../query/use-inzhur-gain.query';
import { InzhurAllTimeGainLine } from '../inzhur-all-time-gain-line/inzhur-all-time-gain-line';

interface Props {
    readonly fundAccountId: number;
}

export const InzhurFundGainLine = ({ fundAccountId }: Props) => {
    const report = useInzhurFundGainQuery(fundAccountId);

    return isDefined(report) ? <InzhurAllTimeGainLine gains={report.gains} /> : null;
};
