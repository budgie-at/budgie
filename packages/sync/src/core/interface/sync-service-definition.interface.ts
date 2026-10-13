import type { SyncAccountInterface } from './sync-account.interface';
import type { AccountTypeEnum, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';

export interface SyncServiceDefinitionInterface {
    readonly provider: ExternalSourceEnum;
    readonly accountType: AccountTypeEnum;
    readonly generateAccountTitle: (account: SyncAccountInterface) => string;
    readonly accountIcon: (account: SyncAccountInterface) => UserIconNameEnum;
}
