import type { BackupKeyUnavailableError } from '../error/backup-key-unavailable.error';
import type { CloudAccountUnavailableError } from '../error/cloud-account-unavailable.error';
import type { CloudNetworkUnavailableError } from '../error/cloud-network-unavailable.error';
import type { CloudQuotaExceededError } from '../error/cloud-quota-exceeded.error';
import type { EncryptedDataResetError } from '../error/encrypted-data-reset.error';

export type CloudTransportErrorType =
    | CloudAccountUnavailableError
    | CloudQuotaExceededError
    | CloudNetworkUnavailableError
    | BackupKeyUnavailableError
    | EncryptedDataResetError;
