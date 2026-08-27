import { EmptyFn } from '@rnw-community/shared';

import { SyncAccountPreviewInterface } from './sync-account-preview.interface';

export interface AccountSelectionInterface {
    readonly accountPreviews: SyncAccountPreviewInterface[];
    readonly selectedAccounts: Set<string>;
    readonly setPreviews: (previews: SyncAccountPreviewInterface[]) => void;
    readonly toggleAccount: (externalId: string) => void;
    readonly selectAllAccounts: EmptyFn;
    readonly deselectAllAccounts: EmptyFn;
}
