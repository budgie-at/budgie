import { AccountDebtTypeEnum } from '../enum/account-debt-type.enum';
import { AccountTypeEnum } from '../enum/account-type.enum';

export interface AccountFilterInterface {
    readonly debtType?: AccountDebtTypeEnum;
    readonly excludeAccountId?: number | null;
    readonly excludeTypes?: AccountTypeEnum[];
    readonly includeTypes?: AccountTypeEnum[];
    readonly onlyActive?: boolean;
}
