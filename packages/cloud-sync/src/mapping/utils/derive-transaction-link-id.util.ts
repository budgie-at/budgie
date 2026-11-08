import { deriveSyncId } from '@budgie/contracts';

const TRANSACTION_LINK_NAMESPACE = '5d7e0a3c-2f6b-4b1e-9c84-0e1a6f3d7b92';

export const deriveTransactionLinkId = (transactionSyncId: string): string => deriveSyncId(TRANSACTION_LINK_NAMESPACE, transactionSyncId);
