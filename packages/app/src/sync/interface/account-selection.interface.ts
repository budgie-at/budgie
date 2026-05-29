import { EmptyFn } from '@rnw-community/shared';

import { BankAccountPreviewInterface } from './bank-account-preview.interface';

export interface AccountSelectionInterface {
    readonly accountPreviews: BankAccountPreviewInterface[];
    readonly selectedAccounts: Set<string>;
    readonly setPreviews: (previews: BankAccountPreviewInterface[]) => void;
    readonly toggleAccount: (externalId: string) => void;
    readonly selectAllAccounts: EmptyFn;
    readonly deselectAllAccounts: EmptyFn;
}
