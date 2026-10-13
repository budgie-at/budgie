import { SyncAccountPreviewInterface } from '@budgie/sync';

import { EmptyFn } from '@rnw-community/shared';

export interface AccountSelectionInterface {
    readonly accountPreviews: SyncAccountPreviewInterface[];
    readonly selectedAccounts: Set<string>;
    readonly setPreviews: (previews: SyncAccountPreviewInterface[]) => void;
    readonly onToggle: (externalId: string) => void;
    readonly onSelectAll: EmptyFn;
    readonly onDeselectAll: EmptyFn;
}
