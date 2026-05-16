import { SyncBatchKindEnum } from '../enum/sync-batch-kind.enum';

import type { BackwardSweepWindowResultInterface } from './backward-sweep-window-result.interface';
import type { BankSyncBatchResultInterface } from './bank-sync-batch-result.interface';

export type SyncBatchTaggedResult =
    | { readonly kind: SyncBatchKindEnum.FORWARD; readonly result: BankSyncBatchResultInterface }
    | { readonly kind: SyncBatchKindEnum.BACKWARD; readonly result: BackwardSweepWindowResultInterface };
