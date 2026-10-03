import { SyncAccountPreviewInterface } from '@budgie/sync';

import { EmptyFn } from '@rnw-community/shared';

export interface AccountSelectionInterface {
    readonly accountPreviews: SyncAccountPreviewInterface[];
    readonly selectedAccounts: Set<string>;
    readonly setPreviews: (previews: SyncAccountPreviewInterface[]) => void;
    readonly toggleAccount: (externalId: string) => void;
    readonly selectAllAccounts: EmptyFn;
    readonly deselectAllAccounts: EmptyFn;
}
