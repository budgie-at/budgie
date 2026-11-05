import { isDefined } from '@rnw-community/shared';

import { useInzhurInstitutionGainQuery } from '../../query/use-inzhur-gain.query';
import { InzhurAllTimeGainLine } from '../inzhur-all-time-gain-line/inzhur-all-time-gain-line';

export const InzhurInstitutionGainLine = () => {
    const report = useInzhurInstitutionGainQuery();

    return isDefined(report) ? <InzhurAllTimeGainLine gains={report.gains} /> : null;
};
