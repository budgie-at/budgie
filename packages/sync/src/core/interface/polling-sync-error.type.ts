import type { SyncError } from './sync-error.type';
import type { AccountNotFoundError, DbError } from '@budgie/contracts';
import type { DebtTransferNotAllowedError, DepositNegativeBalanceError } from '@budgie/ledger';

export type PollingSyncError = SyncError | DbError | AccountNotFoundError | DepositNegativeBalanceError | DebtTransferNotAllowedError;
