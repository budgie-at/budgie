import { AccountTypeEnum, InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';

import type { YieldPositionSummaryInterface } from '@budgie/market';

interface Props {
    readonly position: Pick<YieldPositionSummaryInterface, 'accountType' | 'instrumentCode' | 'instrumentType'>;
}

const ICON_SIZE = 36;

export const YieldPositionIcon = ({ position }: Props) => {
    const isRated = position.accountType === AccountTypeEnum.DEPOSIT || position.accountType === AccountTypeEnum.SAVINGS;
    const accountIcon = isRated ? UserIconNameEnum.PiggyBank : UserIconNameEnum.Landmark;

    if (position.instrumentType === InstrumentTypeEnum.CRYPTO) {
        return <CryptoCurrencyIcon code={position.instrumentCode} size={ICON_SIZE} />;
    }

    return <GroupedListIcon icon={accountIcon} />;
};
