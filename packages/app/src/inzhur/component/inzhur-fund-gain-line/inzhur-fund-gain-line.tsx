import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useInzhurFundCostReturnQuery } from '../../query/use-inzhur-gain.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurGainLine } from '../inzhur-gain-line/inzhur-gain-line';

interface Props {
    readonly fundAccountId: number;
}

export const InzhurFundGainLine = ({ fundAccountId }: Props) => {
    const { t } = useLingui();
    const costReturn = useInzhurFundCostReturnQuery(fundAccountId);

    if (!isDefined(costReturn)) {
        return null;
    }

    return (
        <InzhurGainLine
            gain={costReturn.returnAmount}
            percent={costReturn.percent}
            suffix={t`return on what you paid`}
            testID={InzhurSelector.GainLine}
        />
    );
};
