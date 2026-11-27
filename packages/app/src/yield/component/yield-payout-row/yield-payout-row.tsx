import { YieldPayoutRowContent } from '../yield-payout-row-content/yield-payout-row-content';
import { YieldRowSurface } from '../yield-row-surface/yield-row-surface';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { YieldPayoutRowPropsInterface } from '../../interface/yield-payout-row-props.interface';

interface Props extends YieldPayoutRowPropsInterface {
    readonly rowPosition: TransactionListRowPositionEnum;
}

export const YieldPayoutRow = ({ rowPosition, ...content }: Props) => (
    <YieldRowSurface position={rowPosition}>
        <YieldPayoutRowContent {...content} />
    </YieldRowSurface>
);
