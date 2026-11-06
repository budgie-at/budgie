import type { SyncError } from './sync-error.type';
import type { AccountNotFoundError, DbError } from '@budgie/contracts';
import type { DepositNegativeBalanceError } from '@budgie/ledger';

export type PollingSyncError = SyncError | DbError | AccountNotFoundError | DepositNegativeBalanceError;
