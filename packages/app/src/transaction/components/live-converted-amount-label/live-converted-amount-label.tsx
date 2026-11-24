import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { useConvertedAmount } from '../../hook/use-converted-amount.hook';
import { ConvertedAmountText } from '../converted-amount-text/converted-amount-text';

interface Props {
    readonly instrumentId: number;
    readonly amount: number;
}

export const LiveConvertedAmountLabel = ({ instrumentId, amount }: Props) => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const liveConversion = useConvertedAmount(instrumentId, defaultInstrumentId, amount);

    return isDefined(liveConversion) ? <ConvertedAmountText amount={liveConversion.amount} /> : null;
};
