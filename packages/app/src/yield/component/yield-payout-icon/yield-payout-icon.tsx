import { YIELD_GROUP_BY_KIND } from '@budgie/market';

import { isDefined } from '@rnw-community/shared';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { YieldGroupIcon } from '../yield-group-icon/yield-group-icon';

import type { YieldKindEnum } from '@budgie/contracts';

interface Props {
    readonly kind: YieldKindEnum;
    readonly cryptoCode: string | null;
}

export const YieldPayoutIcon = ({ kind, cryptoCode }: Props) => {
    const group = YIELD_GROUP_BY_KIND[kind];

    if (isDefined(cryptoCode)) {
        return <CryptoCurrencyIcon code={cryptoCode} size={36} />;
    }

    return isDefined(group) ? <YieldGroupIcon group={group} /> : null;
};
