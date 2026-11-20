import { UserIconNameEnum } from '@budgie/contracts';
import { YieldRangeEnum } from '@budgie/market';
import { useAtomSet } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';

import { Icon } from '../../../@generic/component/icon/icon';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import { yieldRangeAtom } from '../../constant/yield-range-atom.constant';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { getYieldRowBorderClassName } from '../../utils/get-yield-row-border-class-name.util';
import { YieldRow } from '../yield-row/yield-row';

export const YieldOlderPayoutsRow = () => {
    const { t } = useLingui();
    const setRange = useAtomSet(yieldRangeAtom);
    const { cancelScrub } = use(YieldSelectionContext);

    const title = t`Older payouts · All time`;

    const handlePress = () => {
        cancelScrub();
        setRange(YieldRangeEnum.ALL);
        router.setParams({ range: YieldRangeEnum.ALL, focus: '' });
    };

    return (
        <TransactionRowSurface
            position={TransactionListRowPositionEnum.SINGLE}
            separatorInset={0}
            className={getYieldRowBorderClassName(TransactionListRowPositionEnum.SINGLE)}
        >
            <YieldRow
                left={null}
                title={title}
                subtitle=""
                trailing={<Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />}
                accessibilityLabel={title}
                onPress={handlePress}
                testID={PassiveIncomeSelector.OlderPayouts}
            />
        </TransactionRowSurface>
    );
};
