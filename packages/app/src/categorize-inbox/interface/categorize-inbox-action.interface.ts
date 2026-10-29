import { CategorizeInboxActionTypeEnum } from '../enum/categorize-inbox-action-type.enum';

import type { CategorizeInboxRowInterface, CategorizeInboxSessionInterface } from '@budgie/categorization';

export type CategorizeInboxActionInterface =
    | { readonly type: CategorizeInboxActionTypeEnum.CLUSTER_EXPANSION_TOGGLED; readonly clusterKey: string }
    | { readonly type: CategorizeInboxActionTypeEnum.EXCLUSION_TOGGLED; readonly transactionId: number }
    | { readonly type: CategorizeInboxActionTypeEnum.TRANSACTIONS_HIDDEN; readonly transactionIds: readonly number[] }
    | { readonly type: CategorizeInboxActionTypeEnum.TRANSACTIONS_SHOWN; readonly transactionIds: readonly number[] }
    | { readonly type: CategorizeInboxActionTypeEnum.ROWS_CHANGED; readonly rows: CategorizeInboxRowInterface[] }
    | { readonly type: CategorizeInboxActionTypeEnum.SESSION_SYNCED; readonly session: CategorizeInboxSessionInterface };
