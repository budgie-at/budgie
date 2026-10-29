import type { CreateMonobankAccountActionTypeEnum } from '../enum/create-monobank-account-action-type.enum';
import type { SyncHistoryDepthEnum } from '@budgie/sync';

export type CreateMonobankAccountActionInterface =
    | { readonly type: CreateMonobankAccountActionTypeEnum.TOKEN_CHANGED; readonly token: string }
    | { readonly type: CreateMonobankAccountActionTypeEnum.HISTORY_DEPTH_SELECTED; readonly historyDepth: SyncHistoryDepthEnum }
    | { readonly type: CreateMonobankAccountActionTypeEnum.ACCOUNTS_FETCHED }
    | { readonly type: CreateMonobankAccountActionTypeEnum.CONTINUED_TO_HISTORY }
    | { readonly type: CreateMonobankAccountActionTypeEnum.STEP_BACK };
