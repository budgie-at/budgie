import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useInzhurFundCostReturnQuery, useInzhurFundGainQuery } from '../../query/use-inzhur-gain.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurAllTimeGainLine } from '../inzhur-all-time-gain-line/inzhur-all-time-gain-line';
import { InzhurGainLine } from '../inzhur-gain-line/inzhur-gain-line';

interface Props {
    readonly fundAccountId: number;
}

export const InzhurFundGainLine = ({ fundAccountId }: Props) => {
    const { t } = useLingui();
    const report = useInzhurFundGainQuery(fundAccountId);
    const costReturn = useInzhurFundCostReturnQuery(fundAccountId);

    if (isDefined(costReturn)) {
        return (
            <InzhurGainLine
                gain={costReturn.returnAmount}
                percent={costReturn.percent}
                suffix={t`return on what you paid`}
                testID={InzhurSelector.GainLine}
            />
        );
    }

    return isDefined(report) ? <InzhurAllTimeGainLine gains={report.gains} /> : null;
};
