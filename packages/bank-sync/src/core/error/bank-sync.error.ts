import { BankSyncErrorCodeEnum } from '../enum/bank-sync-error-code.enum';

import type { BankProviderEnum } from '../enum/bank-provider.enum';
import type { BankSyncErrorInterface } from '../interface/bank-sync-error.interface';

export class BankSyncError extends Error implements BankSyncErrorInterface {
    readonly code: BankSyncErrorCodeEnum;
    readonly provider: BankProviderEnum;
    readonly originalError?: unknown;

    constructor(code: BankSyncErrorCodeEnum, message: string, provider: BankProviderEnum, originalError?: unknown) {
        super(message);
        this.name = 'BankSyncError';
        this.code = code;
        this.provider = provider;
        this.originalError = originalError;
    }

    static unauthorized(provider: BankProviderEnum, originalError?: unknown): BankSyncError {
        return new BankSyncError(BankSyncErrorCodeEnum.UNAUTHORIZED, 'Unauthorized access', provider, originalError);
    }

    static rateLimited(provider: BankProviderEnum, originalError?: unknown): BankSyncError {
        return new BankSyncError(BankSyncErrorCodeEnum.RATE_LIMITED, 'Rate limit exceeded', provider, originalError);
    }

    static networkError(provider: BankProviderEnum, originalError?: unknown): BankSyncError {
        return new BankSyncError(BankSyncErrorCodeEnum.NETWORK_ERROR, 'Network error occurred', provider, originalError);
    }

    static invalidToken(provider: BankProviderEnum, originalError?: unknown): BankSyncError {
        return new BankSyncError(BankSyncErrorCodeEnum.INVALID_TOKEN, 'Invalid API token', provider, originalError);
    }

    static invalidResponse(provider: BankProviderEnum, originalError?: unknown): BankSyncError {
        return new BankSyncError(BankSyncErrorCodeEnum.INVALID_RESPONSE, 'Invalid API response', provider, originalError);
    }
}
