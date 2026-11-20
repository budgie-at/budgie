import { YIELD_GROUP_BY_KIND } from '@budgie/market';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { Icon } from '../../../@generic/component/icon/icon';
import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { YIELD_GROUP_COLOR } from '../../constant/yield-group-color.constant';
import { YIELD_GROUP_ICON } from '../../constant/yield-group-icon.constant';

import type { YieldKindEnum } from '@budgie/contracts';

interface Props {
    readonly kind: YieldKindEnum;
    readonly cryptoCode: string | null;
}

export const YieldPayoutIcon = ({ kind, cryptoCode }: Props) => {
    const isIncreaseContrast = useIsIncreaseContrast();
    const group = YIELD_GROUP_BY_KIND[kind];

    if (isDefined(cryptoCode)) {
        return <CryptoCurrencyIcon code={cryptoCode} size={36} />;
    }

    if (!isDefined(group)) {
        return null;
    }

    const backgroundClassName = YIELD_GROUP_COLOR[group][isIncreaseContrast ? 'backgroundContrast' : 'background'];

    return (
        <View className={cn('size-[36px] shrink-0 items-center justify-center rounded-full', backgroundClassName)}>
            <Icon icon={YIELD_GROUP_ICON[group]} size={18} className="text-white" />
        </View>
    );
};
