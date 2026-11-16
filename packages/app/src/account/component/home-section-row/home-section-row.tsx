import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { getHomeSectionItemPosition } from '../../utils/get-home-section-item-position.util';
import { HomeSectionItem } from '../home-section-item/home-section-item';

import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import type { HomeHoldingReturnsInterface } from '../../interface/home-holding-returns.interface';
import type { HomeSectionInterface } from '../../interface/home-section.interface';

interface Props {
    readonly item: HomeSectionInterface['data'][number];
    readonly index: number;
    readonly section: HomeSectionInterface;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly holdingReturns: HomeHoldingReturnsInterface;
}

export const HomeSectionRow = ({ item, index, section, balancesByAccountId, holdingReturns }: Props) => (
    <TransactionRowSurface separatorInset={64} position={getHomeSectionItemPosition(section, index)}>
        <HomeSectionItem item={item} section={section} balancesByAccountId={balancesByAccountId} holdingReturns={holdingReturns} />
    </TransactionRowSurface>
);
