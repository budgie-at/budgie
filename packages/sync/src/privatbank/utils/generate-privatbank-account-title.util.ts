import { generateDefaultSyncAccountTitle } from '../../core/utils/generate-default-sync-account-title.util';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';

export const generatePrivatbankAccountTitle = (account: SyncAccountInterface): string =>
    generateDefaultSyncAccountTitle('Privatbank', account);
