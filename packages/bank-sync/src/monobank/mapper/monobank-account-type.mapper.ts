import { AccountType } from '@liaugust/monobank-sdk';

import { BankAccountTypeEnum } from '../../core/enum/bank-account-type.enum';

const monobankAccountTypeMap = new Map<AccountType, BankAccountTypeEnum>([
    [AccountType.Black, BankAccountTypeEnum.BLACK],
    [AccountType.White, BankAccountTypeEnum.WHITE],
    [AccountType.Platinum, BankAccountTypeEnum.PLATINUM],
    [AccountType.Iron, BankAccountTypeEnum.IRON],
    [AccountType.Fop, BankAccountTypeEnum.FOP],
    [AccountType.Yellow, BankAccountTypeEnum.YELLOW],
    [AccountType.EAid, BankAccountTypeEnum.EAID]
]);

export const monobankAccountTypeMapper = (type: AccountType): BankAccountTypeEnum =>
    monobankAccountTypeMap.get(type) ?? BankAccountTypeEnum.UNKNOWN;
