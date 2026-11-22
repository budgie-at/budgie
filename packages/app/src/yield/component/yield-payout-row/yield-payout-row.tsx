import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { YIELD_ROW_SEPARATOR_INSET } from '../../constant/yield-row-separator-inset.constant';
import { getYieldRowBorderClassName } from '../../utils/get-yield-row-border-class-name.util';
import { YieldPayoutRowContent } from '../yield-payout-row-content/yield-payout-row-content';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { YieldPayoutRowPropsInterface } from '../../interface/yield-payout-row-props.interface';

interface Props extends YieldPayoutRowPropsInterface {
    readonly rowPosition: TransactionListRowPositionEnum;
}

export const YieldPayoutRow = ({ rowPosition, ...content }: Props) => (
    <TransactionRowSurface
        position={rowPosition}
        separatorInset={YIELD_ROW_SEPARATOR_INSET}
        className={getYieldRowBorderClassName(rowPosition)}
    >
        <YieldPayoutRowContent {...content} />
    </TransactionRowSurface>
);
