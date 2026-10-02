import { CashbackType } from '@liaugust/monobank-sdk';

import { isDefined } from '@rnw-community/shared';

import { CashbackTypeEnum } from '../../core/enum/cashback-type.enum';

const monobankCashbackTypeMap = new Map<CashbackType, CashbackTypeEnum>([
    [CashbackType.None, CashbackTypeEnum.NONE],
    [CashbackType.UAH, CashbackTypeEnum.UAH],
    [CashbackType.Miles, CashbackTypeEnum.MILES]
]);

// Live FOP accounts omit `cashbackType` entirely, so absence maps to NONE.
export const monobankCashbackTypeMapper = (type: CashbackType | undefined): CashbackTypeEnum =>
    isDefined(type) ? (monobankCashbackTypeMap.get(type) ?? CashbackTypeEnum.NONE) : CashbackTypeEnum.NONE;
