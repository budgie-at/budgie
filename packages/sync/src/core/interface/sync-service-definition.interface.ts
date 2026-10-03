import type { SyncAccountInterface } from './sync-account.interface';
import type { AccountTypeEnum, Db, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';
import type * as HttpClient from 'effect/http/HttpClient';

export interface SyncServiceDefinitionInterface {
    readonly provider: ExternalSourceEnum;
    readonly accountType: AccountTypeEnum;
    readonly generateAccountTitle: (account: SyncAccountInterface) => string;
    readonly accountIcon: (account: SyncAccountInterface) => UserIconNameEnum;
    readonly afterSyncEnabledChange?: (enabled: boolean) => Effect.Effect<void, never, Db | HttpClient.HttpClient>;
}
