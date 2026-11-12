import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromeScrollFade } from '../../../@generic/component/collapsible-chrome-scroll-fade/collapsible-chrome-scroll-fade';
import { GainLine } from '../../../@generic/component/gain-line/gain-line';
import { useUnitValuationRateQuery } from '../../../exchange-rate/query/use-unit-valuation-rate.query';
import { useInstrumentPositionsQuery } from '../../../market-data/query/use-instrument-positions.query';
import { calculateInstrumentReturn } from '../../../market-data/utils/calculate-instrument-return.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { BrokerageSelector } from '../../selector/brokerage.selector';

import type { AccountEntityInterface } from '@budgie/contracts';

const PERCENT = 100;

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'instrumentId'>;
    readonly balance: number;
}

export const SecurityPositionGainLine = ({ account, balance }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const position = useInstrumentPositionsQuery([account.instrumentId], defaultInstrument.id, [account.id]).at(0);
    const valuationRate = useUnitValuationRateQuery(account.instrumentId, defaultInstrument.id);

    const instrumentReturn = isDefined(position) ? calculateInstrumentReturn(position, valuationRate, balance) : null;

    if (!isDefined(instrumentReturn)) {
        return null;
    }

    const percent = isDefined(instrumentReturn.percent) ? instrumentReturn.percent / PERCENT : null;

    return (
        <CollapsibleChromeScrollFade>
            <GainLine
                gain={instrumentReturn.profit}
                percent={percent}
                suffix={t`return`}
                instrumentSymbol={defaultInstrument.symbol}
                testID={BrokerageSelector.PositionGainLine}
            />
        </CollapsibleChromeScrollFade>
    );
};
