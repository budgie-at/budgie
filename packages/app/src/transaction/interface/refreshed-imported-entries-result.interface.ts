import { RefreshedImportedEntriesStatusEnum } from '../type/refreshed-imported-entries-status.enum';

import type { TransactionEntryCreateEntityInterface } from '@budgie/contracts';

export interface RefreshedImportedEntriesResultInterface {
    readonly status: RefreshedImportedEntriesStatusEnum;
    readonly entries: readonly TransactionEntryCreateEntityInterface[] | null;
}
