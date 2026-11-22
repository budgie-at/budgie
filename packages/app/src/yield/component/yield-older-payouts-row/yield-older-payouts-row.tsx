import { YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';

import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import { useYieldRangeChange } from '../../hook/use-yield-range-change.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { getYieldRowBorderClassName } from '../../utils/get-yield-row-border-class-name.util';
import { YieldRow } from '../yield-row/yield-row';

export const YieldOlderPayoutsRow = () => {
    const { t } = useLingui();
    const changeRange = useYieldRangeChange();

    const title = t`Older payouts · All time`;

    const handlePress = () => void changeRange(YieldRangeEnum.ALL);

    return (
        <TransactionRowSurface
            position={TransactionListRowPositionEnum.SINGLE}
            separatorInset={0}
            className={getYieldRowBorderClassName(TransactionListRowPositionEnum.SINGLE)}
        >
            <YieldRow title={title} accessibilityLabel={title} onPress={handlePress} testID={PassiveIncomeSelector.OlderPayouts} />
        </TransactionRowSurface>
    );
};
