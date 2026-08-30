import { CashbackType } from '@liaugust/monobank-sdk';

import { isDefined } from '@rnw-community/shared';

import { CashbackTypeEnum } from '../../core/enum/cashback-type.enum';

const monobankCashbackTypeMap = new Map<CashbackType, CashbackTypeEnum>([
    [CashbackType.None, CashbackTypeEnum.NONE],
    [CashbackType.UAH, CashbackTypeEnum.UAH],
    [CashbackType.Miles, CashbackTypeEnum.MILES]
]);

export const monobankCashbackTypeMapper = (type?: CashbackType): CashbackTypeEnum => {
    if (!isDefined(type)) {
        return CashbackTypeEnum.NONE;
    }

    return monobankCashbackTypeMap.get(type) ?? CashbackTypeEnum.NONE;
};
