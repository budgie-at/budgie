import { CashbackTypeEnum } from '../../core/enum/cashback-type.enum';
import { MonobankCashbackTypeEnum } from '../enum/monobank-cashback-type.enum';

const monobankCashbackTypeMap = new Map<MonobankCashbackTypeEnum, CashbackTypeEnum>([
    [MonobankCashbackTypeEnum.NONE, CashbackTypeEnum.NONE],
    [MonobankCashbackTypeEnum.UAH, CashbackTypeEnum.UAH],
    [MonobankCashbackTypeEnum.MILES, CashbackTypeEnum.MILES]
]);

export const monobankCashbackTypeMapper = (type: MonobankCashbackTypeEnum): CashbackTypeEnum =>
    monobankCashbackTypeMap.get(type) ?? CashbackTypeEnum.NONE;
