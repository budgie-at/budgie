import { BankAccountTypeEnum } from '../../core/enum/bank-account-type.enum';
import { MonobankAccountTypeEnum } from '../enum/monobank-account-type.enum';

const monobankAccountTypeMap = new Map<MonobankAccountTypeEnum, BankAccountTypeEnum>([
    [MonobankAccountTypeEnum.BLACK, BankAccountTypeEnum.BLACK],
    [MonobankAccountTypeEnum.WHITE, BankAccountTypeEnum.WHITE],
    [MonobankAccountTypeEnum.PLATINUM, BankAccountTypeEnum.PLATINUM],
    [MonobankAccountTypeEnum.IRON, BankAccountTypeEnum.IRON],
    [MonobankAccountTypeEnum.FOP, BankAccountTypeEnum.FOP],
    [MonobankAccountTypeEnum.YELLOW, BankAccountTypeEnum.YELLOW],
    [MonobankAccountTypeEnum.EAID, BankAccountTypeEnum.EAID]
]);

export const monobankAccountTypeMapper = (type: MonobankAccountTypeEnum): BankAccountTypeEnum =>
    monobankAccountTypeMap.get(type) ?? BankAccountTypeEnum.UNKNOWN;
