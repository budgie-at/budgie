import { AccountTypeEnum } from '../enum/account-type.enum';

export interface AccountFilterInterface {
    readonly excludeTypes?: AccountTypeEnum[];
}
