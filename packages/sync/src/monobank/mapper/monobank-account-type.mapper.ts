import { AccountType } from '@liaugust/monobank-sdk';

import { SyncAccountTypeEnum } from '../../core/enum/sync-account-type.enum';

const monobankAccountTypeMap = new Map<AccountType, SyncAccountTypeEnum>([
    [AccountType.Black, SyncAccountTypeEnum.BLACK],
    [AccountType.White, SyncAccountTypeEnum.WHITE],
    [AccountType.Platinum, SyncAccountTypeEnum.PLATINUM],
    [AccountType.Iron, SyncAccountTypeEnum.IRON],
    [AccountType.Fop, SyncAccountTypeEnum.FOP],
    [AccountType.Yellow, SyncAccountTypeEnum.YELLOW],
    [AccountType.EAid, SyncAccountTypeEnum.EAID]
]);

export const monobankAccountTypeMapper = (type: AccountType): SyncAccountTypeEnum =>
    monobankAccountTypeMap.get(type) ?? SyncAccountTypeEnum.UNKNOWN;
