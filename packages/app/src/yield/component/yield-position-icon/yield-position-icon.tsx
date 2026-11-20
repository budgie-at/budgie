import { AccountTypeEnum, InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { YIELD_GROUP_BY_KIND } from '@budgie/market';

import { isDefined } from '@rnw-community/shared';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { YIELD_GROUP_ICON } from '../../constant/yield-group-icon.constant';

import type { YieldPositionSummaryInterface } from '@budgie/market';

interface Props {
    readonly position: Pick<YieldPositionSummaryInterface, 'accountType' | 'instrumentCode' | 'instrumentType' | 'kind'>;
}

const ICON_SIZE = 36;

export const YieldPositionIcon = ({ position }: Props) => {
    const isRated = position.accountType === AccountTypeEnum.DEPOSIT || position.accountType === AccountTypeEnum.SAVINGS;
    const group = isDefined(position.kind) ? YIELD_GROUP_BY_KIND[position.kind] : null;
    const fallbackIcon = isRated ? UserIconNameEnum.PiggyBank : UserIconNameEnum.Landmark;
    const accountIcon = isDefined(group) ? YIELD_GROUP_ICON[group] : fallbackIcon;

    if (position.instrumentType === InstrumentTypeEnum.CRYPTO) {
        return <CryptoCurrencyIcon code={position.instrumentCode} size={ICON_SIZE} />;
    }

    return <GroupedListIcon icon={accountIcon} />;
};
