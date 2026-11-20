import { AccountTypeEnum, InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { YIELD_GROUP_BY_KIND } from '@budgie/market';

import { isDefined } from '@rnw-community/shared';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { YieldGroupIcon } from '../yield-group-icon/yield-group-icon';

import type { YieldPositionSummaryInterface } from '@budgie/market';

interface Props {
    readonly position: Pick<YieldPositionSummaryInterface, 'accountType' | 'instrumentCode' | 'instrumentType' | 'kind'>;
}

const ICON_SIZE = 36;

export const YieldPositionIcon = ({ position }: Props) => {
    const isRated = position.accountType === AccountTypeEnum.DEPOSIT || position.accountType === AccountTypeEnum.SAVINGS;
    const group = isDefined(position.kind) ? YIELD_GROUP_BY_KIND[position.kind] : null;
    const fallbackIcon = isRated ? UserIconNameEnum.PiggyBank : UserIconNameEnum.Landmark;

    if (position.instrumentType === InstrumentTypeEnum.CRYPTO) {
        return <CryptoCurrencyIcon code={position.instrumentCode} size={ICON_SIZE} />;
    }

    return isDefined(group) ? <YieldGroupIcon group={group} /> : <GroupedListIcon icon={fallbackIcon} />;
};
