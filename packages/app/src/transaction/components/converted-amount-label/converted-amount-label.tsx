import { isDefined } from '@rnw-community/shared';

import { ConvertedAmountText } from '../converted-amount-text/converted-amount-text';
import { LiveConvertedAmountLabel } from '../live-converted-amount-label/live-converted-amount-label';

interface Props {
    readonly instrumentId: number;
    readonly amount: number;
    readonly baseAmount: number | null;
}

export const ConvertedAmountLabel = ({ instrumentId, amount, baseAmount }: Props) =>
    isDefined(baseAmount) ? (
        <ConvertedAmountText amount={baseAmount} />
    ) : (
        <LiveConvertedAmountLabel instrumentId={instrumentId} amount={amount} />
    );
