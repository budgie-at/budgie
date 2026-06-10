import { SyncAccountTypeEnum } from '../../core/enum/sync-account-type.enum';
import { MonobankAccountTypeEnum } from '../enum/monobank-account-type.enum';

const monobankAccountTypeMap = new Map<MonobankAccountTypeEnum, SyncAccountTypeEnum>([
    [MonobankAccountTypeEnum.BLACK, SyncAccountTypeEnum.BLACK],
    [MonobankAccountTypeEnum.WHITE, SyncAccountTypeEnum.WHITE],
    [MonobankAccountTypeEnum.PLATINUM, SyncAccountTypeEnum.PLATINUM],
    [MonobankAccountTypeEnum.IRON, SyncAccountTypeEnum.IRON],
    [MonobankAccountTypeEnum.FOP, SyncAccountTypeEnum.FOP],
    [MonobankAccountTypeEnum.YELLOW, SyncAccountTypeEnum.YELLOW],
    [MonobankAccountTypeEnum.EAID, SyncAccountTypeEnum.EAID]
]);

export const monobankAccountTypeMapper = (type: MonobankAccountTypeEnum): SyncAccountTypeEnum =>
    monobankAccountTypeMap.get(type) ?? SyncAccountTypeEnum.UNKNOWN;
