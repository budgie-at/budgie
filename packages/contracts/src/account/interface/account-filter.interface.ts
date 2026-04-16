import { AccountTypeEnum } from '../enum/account-type.enum';

export interface AccountFilterInterface {
    readonly excludeAccountId?: number | null;
    readonly excludeTypes?: AccountTypeEnum[];
    readonly onlyActive?: boolean;
}
