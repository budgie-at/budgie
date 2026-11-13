import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { GainLine } from '../../../@generic/component/gain-line/gain-line';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { useInzhurFundCostReturnQuery } from '../../query/use-inzhur-gain.query';
import { InzhurSelector } from '../../selector/inzhur.selector';

interface Props {
    readonly fundAccountId: number;
}

export const InzhurFundGainLine = ({ fundAccountId }: Props) => {
    const { t } = useLingui();
    const costReturn = useInzhurFundCostReturnQuery(fundAccountId);
    const hryvniaSymbol = useHryvniaInstrumentQuery()?.symbol ?? '';

    if (!isDefined(costReturn)) {
        return null;
    }

    return (
        <GainLine
            gain={costReturn.returnAmount}
            percent={costReturn.percent}
            suffix={t`return on what you paid`}
            instrumentSymbol={hryvniaSymbol}
            testID={InzhurSelector.GainLine}
        />
    );
};
