import { CashbackType } from '@liaugust/monobank-sdk';

import { CashbackTypeEnum } from '../../core/enum/cashback-type.enum';

const monobankCashbackTypeMap = new Map<CashbackType, CashbackTypeEnum>([
    [CashbackType.None, CashbackTypeEnum.NONE],
    [CashbackType.UAH, CashbackTypeEnum.UAH],
    [CashbackType.Miles, CashbackTypeEnum.MILES]
]);

export const monobankCashbackTypeMapper = (type: CashbackType): CashbackTypeEnum =>
    monobankCashbackTypeMap.get(type) ?? CashbackTypeEnum.NONE;
