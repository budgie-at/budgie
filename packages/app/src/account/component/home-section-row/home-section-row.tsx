import { View } from 'react-native';

import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import { isInstitutionGroup } from '../../type-guard/is-institution-group.type-guard';
import { getHomeSectionItemPosition } from '../../utils/get-home-section-item-position.util';
import { HomeProviderGroupLabel } from '../home-provider-group-label/home-provider-group-label';
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

const GROUP_START_POSITIONS = new Set([TransactionListRowPositionEnum.FIRST, TransactionListRowPositionEnum.SINGLE]);

export const HomeSectionRow = ({ item, index, section, balancesByAccountId, holdingReturns }: Props) => {
    const position = getHomeSectionItemPosition(section, index);
    const isProviderGroupStart = isInstitutionGroup(item) && item.isHoldingProvider && GROUP_START_POSITIONS.has(position);

    return (
        <View>
            {isProviderGroupStart ? <HomeProviderGroupLabel items={section.data} /> : null}
            <TransactionRowSurface separatorInset={64} position={position}>
                <HomeSectionItem item={item} section={section} balancesByAccountId={balancesByAccountId} holdingReturns={holdingReturns} />
            </TransactionRowSurface>
        </View>
    );
};
